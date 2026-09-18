import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import prisma from '../config/db';
import { cacheGet, cacheSet } from '../utils/cache';

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

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Verify user still exists (short-TTL cached to avoid a DB hit per request)
    const cacheKey = `auth:user:${decoded.userId}`;
    if (cacheGet<boolean>(cacheKey) === undefined) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'User not found. Token is invalid.',
        });
        return;
      }
      cacheSet(cacheKey, true, AUTH_CACHE_TTL_MS);
    }

    req.user = decoded;
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

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
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

