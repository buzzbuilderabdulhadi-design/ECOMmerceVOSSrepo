import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import config from './config';
import prisma from './config/db';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { requestGuards, sensitiveNoStore } from './middleware/requestGuards';
import { csrfProtection } from './middleware/csrf.middleware';
import { globalApiLimiter } from './middleware/rateLimit.middleware';
import { stripeWebhook as stripeWebhookHandler } from './controllers/webhooks.controller';
import { paypalWebhook as paypalWebhookHandler } from './controllers/paypal.webhook';
import {
  isCloudinaryConfigured,
  isEmailConfigured,
  isGoogleConfigured,
  isPaypalConfigured,
  isStripeConfigured,
} from './config';

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

// Security headers. The JSON API is not an HTML surface, so a deny-by-default
// CSP is safe here; the storefront has its own CSP (client/next.config.ts).
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' },
  hsts: config.env === 'production'
    ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
    : false,
  crossOriginEmbedderPolicy: false,
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
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id', 'x-csrf-token'],
}));

// Compression
app.use(compression());

// Cookie parser
app.use(cookieParser());

// CSRF protection for cookie-authenticated state-changing requests.
app.use('/api', csrfProtection);

// ============================================================
// Request shape guards
//
// Cheap URL/query limits, applied before any route handler so an absurd
// request never reaches the database.
// ============================================================

app.use('/api', requestGuards);

// Per-user responses must never be stored by shared caches.
app.use('/api', sensitiveNoStore);

// ============================================================
// Rate Limiting
//
// Two layers:
//   1. A generous global backstop on /api (below) — catches raw floods from
//      a single IP across the whole API.
//   2. Route-specific limiters mounted inside src/routes/* (login, search,
//      cart mutations, checkout, orders, reviews, contact, admin, uploads…)
//      with limits tuned per action. See src/middleware/rateLimit.middleware.ts.
//
// Mounted BEFORE webhooks so the raw-body endpoints are also rate limited
// (they are public, signature-verified, and externally reachable). Static
// /uploads assets intentionally stay unlimited — they are plain image files.
// ============================================================

// Global API backstop — sized for launch traffic (default 1000 / 15 min).
app.use('/api', globalApiLimiter);

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

// Body parsing.
// JSON is capped at 1mb (the largest legitimate payload is an admin product
// or settings save; images are uploaded as multipart, never base64 in JSON).
// URL-encoded bodies are capped far lower — no legitimate form exceeds it.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

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
      integrations: {
        email: isEmailConfigured(),
        cloudinary: isCloudinaryConfigured(),
        stripe: isStripeConfigured(),
        paypal: isPaypalConfigured(),
        google: isGoogleConfigured(),
      },
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

export default app;
