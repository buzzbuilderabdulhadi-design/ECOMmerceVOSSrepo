import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import prisma from '../config/db';
import { cacheGet, cacheSet } from '../utils/cache';
import { ACCESS_COOKIE } from '../utils/authCookies';
import logger from '../utils/logger';

// Cache "user still exists" for a short window to avoid a DB round-trip on
// every authenticated request. Deletion takes effect within this TTL.
const AUTH_CACHE_TTL_MS = 30_000;

// ============================================================
// Authentication Middleware
// ============================================================

export interface JwtPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ============================================================
// Verify JWT Token — Required Auth
// ============================================================

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    // Production browsers authenticate with the HttpOnly session cookie.
    // Bearer tokens remain accepted for non-browser API clients and for a
    // transition period; both paths are verified identically.
    const token = bearerToken || req.cookies?.[ACCESS_COOKIE];

    if (!token) {
      logger.warn('Authentication failed — no session cookie or bearer token', {
        method: req.method,
        path: req.originalUrl.split('?')[0],
        ip: req.ip,
      });
      res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Verify the user still exists and, critically, that the CURRENT database
    // role matches — admin authorization must never trust the (possibly stale)
    // login-time role embedded in the JWT. Re-checked against the DB with a
    // short-TTL cache so role changes/revocation take effect promptly while
    // avoiding a DB round-trip on every request.
    const cacheKey = `auth:user:${decoded.userId}`;
    let cached = cacheGet<{ id: string; role: string }>(cacheKey);
    if (cached === undefined) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true },
      });

      if (!user) {
        logger.warn('Authentication failed — token subject no longer exists', {
          method: req.method,
          path: req.originalUrl.split('?')[0],
          ip: req.ip,
        });
        res.status(401).json({
          success: false,
          error: 'User not found. Token is invalid.',
        });
        return;
      }
      cached = { id: user.id, role: user.role };
      cacheSet(cacheKey, cached, AUTH_CACHE_TTL_MS);
    }

    req.user = { ...decoded, role: cached.role };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired.',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Authentication failed — invalid token signature', {
        method: req.method,
        path: req.originalUrl.split('?')[0],
        ip: req.ip,
      });
      res.status(401).json({
        success: false,
        error: 'Invalid token.',
      });
      return;
    }
    next(error);
  }
};

// ============================================================
// Optional Auth — Attach user if token present, but don't block
// ============================================================

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const token = bearerToken || req.cookies?.[ACCESS_COOKIE];

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      req.user = decoded;
    }
    next();
  } catch {
    // Token invalid or expired — continue without user
    next();
  }
};

// ============================================================
// Admin Authorization Middleware
// ============================================================

export const authorizeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'ADMIN') {
    logger.warn('Authorization failed — admin role required', {
      method: req.method,
      path: req.originalUrl.split('?')[0],
      userId: req.user?.userId,
      ip: req.ip,
    });
    res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.',
    });
    return;
  }
  next();
};

// ============================================================
// Role-Based Authorization
// ============================================================

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}`,
      });
      return;
    }
    next();
  };
};

