import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import config from './config';
import prisma, { connectDatabase, disconnectDatabase } from './config/db';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { stripeWebhook as stripeWebhookHandler } from './controllers/webhooks.controller';
import { paypalWebhook as paypalWebhookHandler } from './controllers/paypal.webhook';
import logger from './utils/logger';

// ============================================================
// ZOYA GOODS — Express Application Entry Point
// ============================================================

const app = express();

// ============================================================
// Security & Utility Middleware
// ============================================================

// Trust proxy for rate limiting behind reverse proxy. Configurable via
// TRUST_PROXY so deployments can match their actual topology (and disable
// header trust when no proxy is present, preventing X-Forwarded-For spoofing).
app.set('trust proxy', config.trustProxy);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disabled for API — enable if serving HTML
}));

// CORS
// The client's axios instance sends a custom `x-session-id` header on every
// request (guest-cart scoping) plus `Authorization` for logged-in calls. A
// non-safelisted header forces the browser to CORS-preflight each request, so
// it MUST be listed here or every browser call is blocked before it starts.
app.use(cors({
  origin: config.client.url,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
}));

// Compression
app.use(compression());

// Cookie parser
app.use(cookieParser());

// ============================================================
// Rate Limiting
//
// Mounted BEFORE webhooks so the raw-body endpoints are also rate limited
// (they are public, signature-verified, and externally reachable). Static
// /uploads assets intentionally stay unlimited — they are plain image files.
// ============================================================

// Public API limiter — sized for launch traffic (default 1000 / 15 min).
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.publicMax,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
// Auth routes live under /api/v1/auth, so the limiter must be mounted on the
// same path — mounting on /api/auth never matched anything.
app.use('/api/v1/auth', authLimiter);

// Stripe webhook MUST receive the raw body before any JSON parsing so the
// signature can be verified against the exact bytes Stripe signed.
app.post(
  '/api/v1/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler
);

// PayPal webhook MUST also receive the raw body: its signature verification
// endpoint requires the exact event JSON and webhook-specific headers.
app.post(
  '/api/v1/webhooks/paypal',
  express.raw({ type: 'application/json' }),
  paypalWebhookHandler
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (development only). Per-request synchronous stdout logging
// is a known event-loop bottleneck under load, so production skips it and
// relies on the structured logger for errors.
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Serve admin-uploaded files that were not promoted to a CDN.
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads'), {
  maxAge: '7d',
  dotfiles: 'ignore',
  fallthrough: true,
}));

// ============================================================
// Health Check
// ============================================================

app.get('/api/health', async (_req, res) => {
  let dbConnected = false;
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    dbConnected = true;
  } catch {
    dbConnected = false;
  }

  res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,
    data: {
      status: dbConnected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: config.env,
      uptime: process.uptime(),
      database: dbConnected ? 'connected' : 'disconnected',
    },
  });
});

// ============================================================
// API Routes
// ============================================================

import routes from './routes';

app.use('/api/v1', routes);

// ============================================================
// Error Handling
// ============================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================================
// Server Initialization
// ============================================================

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Run config validation
    const { validateConfig } = await import('./config');
    validateConfig();

    app.listen(config.port, () => {
      logger.info(`🚀 ZOYA GOODS Server running on port ${config.port}`);
      logger.info(`🌍 Environment: ${config.env}`);
      logger.info(`🔗 Client URL: ${config.client.url}`);

      if (config.env === 'development') {
        logger.info(`📚 API Docs: http://localhost:${config.port}/api/health`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: String(error) });
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', { error: reason.message, stack: reason.stack });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

startServer();

export default app;
