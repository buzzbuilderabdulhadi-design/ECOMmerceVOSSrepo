import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import config from './config';
import prisma, { connectDatabase, disconnectDatabase } from './config/db';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import logger from './utils/logger';

// ============================================================
// VOSS — Express Application Entry Point
// ============================================================

const app = express();

// ============================================================
// Security & Utility Middleware
// ============================================================

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disabled for API — enable if serving HTML
}));

// CORS
app.use(cors({
  origin: config.client.url,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression
app.use(compression());

// Cookie parser
app.use(cookieParser());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// ============================================================
// Rate Limiting
// ============================================================

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
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
app.use('/api/auth', authLimiter);

// ============================================================
// Health Check
// ============================================================

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.env,
      uptime: process.uptime(),
      database: prisma ? 'connected' : 'disconnected',
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
      logger.info(`🚀 VOSS Server running on port ${config.port}`);
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
