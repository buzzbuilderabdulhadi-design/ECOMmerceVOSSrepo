import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { Request } from 'express';
import config from '../config';
import { getRedisClient } from '../config/redis';
import logger from '../utils/logger';

// ============================================================
// Route-specific rate limiting / abuse control
//
// Every limiter here:
//  - keys on the resolved client IP (Express `req.ip`, which honours the
//    app-level `trust proxy` setting — never on client-supplied identity
//    headers such as x-session-id, which the caller controls),
//  - optionally keys on the authenticated user id when mounted AFTER
//    `authenticate` (so one account cannot exhaust another user's budget),
//  - sends draft-7 RateLimit-* headers plus Retry-After on 429,
//  - uses Redis when REDIS_URL is configured so every app instance shares the
//    same counters. A configured-but-unavailable store fails CLOSED in
//    production (`passOnStoreError: false`); development keeps the memory
//    store so it works with no external services.
//
// Limits are deliberately generous for legitimate browsing and strict only
// for endpoints that create work, write to the database, or trigger
// account/payment side effects.
// ============================================================

/**
 * One RedisStore per limiter (each gets its own key namespace). The command
 * closure resolves the client lazily because limiters are constructed during
 * module import, before `startServer` connects Redis.
 */
function createStore(name: string) {
  if (!config.redis.url) return undefined;
  return new RedisStore({
    prefix: `${config.rateLimit.keyPrefix}${name}:`,
    sendCommand: (...args: string[]) => {
      const client = getRedisClient();
      if (!client) {
        return Promise.reject(new Error('Redis rate-limit store is not connected'));
      }
      return client.sendCommand(args);
    },
  });
}

export const WINDOW = {
  oneMinute: 60 * 1000,
  fiveMinutes: 5 * 60 * 1000,
  quarterHour: 15 * 60 * 1000,
  oneHour: 60 * 60 * 1000,
} as const;

export interface LimiterSpec {
  /** Short label used in security logs only. */
  name: string;
  windowMs: number;
  max: number;
  message: string;
  /**
   * When true the counter is keyed on the authenticated user id (falling
   * back to IP when unauthenticated). Only safe on routes mounted AFTER
   * `authenticate`.
   */
  userKeyed?: boolean;
}

export function createLimiter(spec: LimiterSpec) {
  return rateLimit({
    windowMs: spec.windowMs,
    limit: spec.max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store: createStore(spec.name),
    // Development/absent-store mode still fails open so a local cache issue
    // cannot block work. Production fails closed: silently disabling limits
    // during a Redis outage is worse than rejecting traffic.
    passOnStoreError: config.rateLimit.passOnStoreError,
    keyGenerator: spec.userKeyed
      ? (req: Request) =>
          req.user ? `user:${req.user.userId}` : `ip:${req.ip ?? 'unknown'}`
      : undefined,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        limiter: spec.name,
        method: req.method,
        path: req.originalUrl.split('?')[0],
        ip: req.ip,
        userId: req.user?.userId,
      });
      res.status(429).json({
        success: false,
        error: spec.message,
        code: 'RATE_LIMIT_EXCEEDED',
      });
    },
  });
}

// ------------------------------------------------------------
// Global API backstop
// ------------------------------------------------------------

export const globalApiLimiter = createLimiter({
  name: 'global:api',
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.publicMax,
  message: 'Too many requests, please try again later.',
});

// ------------------------------------------------------------
// Authentication / account endpoints
// ------------------------------------------------------------

export const loginLimiter = createLimiter({
  name: 'auth:login',
  windowMs: WINDOW.quarterHour,
  max: 10,
  message: 'Too many sign-in attempts. Please wait a few minutes and try again.',
});

export const registerLimiter = createLimiter({
  name: 'auth:register',
  windowMs: WINDOW.oneHour,
  max: 10,
  message: 'Too many accounts created from this device. Please try again later.',
});

export const passwordResetLimiter = createLimiter({
  name: 'auth:password-reset',
  windowMs: WINDOW.quarterHour,
  max: 5,
  message: 'Too many password reset requests. Please wait a few minutes and try again.',
});

export const passwordChangeLimiter = createLimiter({
  name: 'auth:password-change',
  windowMs: WINDOW.quarterHour,
  max: 10,
  message: 'Too many password change attempts. Please wait a few minutes and try again.',
});

export const refreshLimiter = createLimiter({
  name: 'auth:refresh',
  windowMs: WINDOW.quarterHour,
  max: 60,
  message: 'Too many session refresh attempts. Please try again shortly.',
});

export const googleAuthLimiter = createLimiter({
  name: 'auth:google',
  windowMs: WINDOW.quarterHour,
  max: 30,
  message: 'Too many sign-in attempts. Please wait a few minutes and try again.',
});

export const sessionLimiter = createLimiter({
  name: 'auth:session',
  windowMs: WINDOW.quarterHour,
  max: 60,
  message: 'Too many requests. Please try again shortly.',
});

// ------------------------------------------------------------
// Catalog reads (search is the expensive one; listing/detail are cached)
// ------------------------------------------------------------

export const searchLimiter = createLimiter({
  name: 'catalog:search',
  windowMs: WINDOW.oneMinute,
  max: 30,
  message: 'Too many search requests. Please slow down and try again.',
});

export const catalogListLimiter = createLimiter({
  name: 'catalog:list',
  windowMs: WINDOW.oneMinute,
  max: 60,
  message: 'Too many catalog requests. Please slow down and try again.',
});

// ------------------------------------------------------------
// Cart / wishlist / coupon mutations
// ------------------------------------------------------------

export const cartReadLimiter = createLimiter({
  name: 'cart:read',
  windowMs: WINDOW.oneMinute,
  max: 60,
  message: 'Too many cart requests. Please try again shortly.',
});

export const cartMutationLimiter = createLimiter({
  name: 'cart:mutate',
  windowMs: WINDOW.oneMinute,
  max: 30,
  message: 'Too many cart changes. Please pause for a moment and try again.',
});

export const cartMergeLimiter = createLimiter({
  name: 'cart:merge',
  windowMs: WINDOW.oneMinute,
  max: 5,
  message: 'Too many cart merge attempts. Please try again shortly.',
});

export const couponLimiter = createLimiter({
  name: 'coupons:validate',
  windowMs: WINDOW.oneMinute,
  max: 20,
  message: 'Too many coupon checks. Please try again shortly.',
});

export const wishlistLimiter = createLimiter({
  name: 'wishlist:mutate',
  windowMs: WINDOW.oneMinute,
  max: 30,
  message: 'Too many wishlist changes. Please pause for a moment and try again.',
});

// ------------------------------------------------------------
// Checkout / orders
// ------------------------------------------------------------

export const checkoutReadLimiter = createLimiter({
  name: 'checkout:read',
  windowMs: WINDOW.oneMinute,
  max: 30,
  message: 'Too many checkout requests. Please refresh and try again.',
});

export const paymentActionLimiter = createLimiter({
  name: 'checkout:payment',
  windowMs: WINDOW.fiveMinutes,
  max: 15,
  message: 'Too many payment attempts. Please wait a few minutes and try again.',
});

export const orderCreateLimiter = createLimiter({
  name: 'orders:create',
  windowMs: WINDOW.fiveMinutes,
  max: 10,
  message: 'Too many order attempts. Please review your cart and try again shortly.',
});

export const orderReadLimiter = createLimiter({
  name: 'orders:read',
  windowMs: WINDOW.oneMinute,
  max: 30,
  message: 'Too many order requests. Please try again shortly.',
});

// ------------------------------------------------------------
// Content submissions (reviews, questions, contact)
// ------------------------------------------------------------

export const contactLimiter = createLimiter({
  name: 'contact:submit',
  windowMs: WINDOW.quarterHour,
  max: 5,
  message: 'Too many messages sent. Please wait a few minutes before writing again.',
});

export const reviewCreateLimiter = createLimiter({
  name: 'reviews:create',
  windowMs: WINDOW.oneHour,
  max: 5,
  userKeyed: true,
  message: 'You have submitted several reviews recently. Please try again later.',
});

export const reviewWriteLimiter = createLimiter({
  name: 'reviews:write',
  windowMs: WINDOW.quarterHour,
  max: 20,
  userKeyed: true,
  message: 'Too many review updates. Please try again shortly.',
});

export const reviewHelpfulLimiter = createLimiter({
  name: 'reviews:helpful',
  windowMs: WINDOW.oneMinute,
  max: 20,
  message: 'Too many requests. Please try again shortly.',
});

export const questionCreateLimiter = createLimiter({
  name: 'questions:create',
  windowMs: WINDOW.oneHour,
  max: 5,
  userKeyed: true,
  message: 'You have asked several questions recently. Please try again later.',
});

export const accountWriteLimiter = createLimiter({
  name: 'account:write',
  windowMs: WINDOW.oneMinute,
  max: 20,
  userKeyed: true,
  message: 'Too many account changes. Please pause for a moment and try again.',
});

// ------------------------------------------------------------
// Admin / privileged operations
// ------------------------------------------------------------

export const adminLimiter = createLimiter({
  name: 'admin:general',
  windowMs: WINDOW.fiveMinutes,
  max: 600,
  userKeyed: true,
  message: 'Too many admin requests. Please wait a moment and try again.',
});

export const adminWriteLimiter = createLimiter({
  name: 'admin:write',
  windowMs: WINDOW.oneMinute,
  max: 60,
  userKeyed: true,
  message: 'Too many admin changes. Please slow down and try again.',
});

export const uploadLimiter = createLimiter({
  name: 'admin:upload',
  windowMs: WINDOW.quarterHour,
  max: 40,
  userKeyed: true,
  message: 'Too many uploads. Please wait a few minutes and try again.',
});
