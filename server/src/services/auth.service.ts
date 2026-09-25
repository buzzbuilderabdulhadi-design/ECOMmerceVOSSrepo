import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config';
import prisma from '../config/db';
import { ApiError } from '../utils/apiError';

interface TokenPayload {
  userId: string;
  role: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as any });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn as any });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
};

// Refresh tokens are opaque to the DB (we only persist a hash) so a database
// leak never exposes a usable token. Rotation invalidates the previous token:
// presenting a stale token clears the session (reuse/theft detection).
const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const registerUser = async (data: { name: string; email: string; password: string }) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) throw ApiError.conflict('Email already registered');
  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return issueSession(user.id, user.role);
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw ApiError.unauthorized('Invalid email or password');
  // Accounts created via Google have no password — they must continue using
  // Google sign-in. Reject password auth explicitly (bcrypt would also fail).
  if (!user.passwordHash) throw ApiError.unauthorized('Invalid email or password');
  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) throw ApiError.unauthorized('Invalid email or password');
  return issueSession(user.id, user.role);
};

export const refreshUserToken = async (token: string) => {
  const decoded = verifyRefreshToken(token);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, role: true, refreshTokenHash: true },
  });
  if (!user) throw ApiError.unauthorized('User not found');

  // If a session hash is recorded it must match the presented token. A
  // mismatch means this token was rotated already (or revoked) — treat it as
  // compromise and clear the stored session.
  if (user.refreshTokenHash && user.refreshTokenHash !== hashToken(token)) {
    await prisma.user
      .update({ where: { id: user.id }, data: { refreshTokenHash: null } })
      .catch(() => {});
    throw ApiError.unauthorized('Refresh token is no longer valid');
  }

  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: hashToken(refreshToken) },
  });
  return { accessToken, refreshToken };
};

export const requestPasswordReset = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    // Do not reveal whether the email exists
    return;
  }
  const resetToken = generateResetToken();
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  // Store only a SHA-256 hash of the token so a database leak never exposes a
  // usable reset link (same pattern as refresh tokens).
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: resetTokenHash, resetTokenExpiry },
  });
  return { email: user.email, resetToken };
};

export const resetPassword = async (token: string, newPassword: string) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await prisma.user.findFirst({
    where: { resetToken: tokenHash, resetTokenExpiry: { gt: new Date() } },
  });
  if (!user) throw ApiError.badRequest('Invalid or expired password reset link');
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null, refreshTokenHash: null },
  });
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');
  const isValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isValid) throw ApiError.badRequest('Current password is incorrect');
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash, refreshTokenHash: null } });
};

// ============================================================
// Session issuance — shared by email registration, email login,
// and Google sign-in so every entry point produces identical
// access/refresh tokens + a safe user payload (no secrets).
// ============================================================

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  phone: true,
  emailVerified: true,
  googleId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const issueSession = async (userId: string, role: string) => {
  const accessToken = generateAccessToken({ userId, role });
  const refreshToken = generateRefreshToken({ userId, role });
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: hashToken(refreshToken) },
  });
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: SAFE_USER_SELECT,
  });
  return { user, accessToken, refreshToken };
};

// ============================================================
// Google OAuth 2.0 / OpenID Connect — authorization-code flow.
//
// The client redirects the browser to our GET /auth/google, which
// 302s the user to accounts.google.com. Google redirects back to
// the client callback page (?code + state), the client posts the
// code to POST /auth/google/callback, and ONLY the server exchanges
// it for tokens using the client secret (never exposed to the
// browser). The server then reads the verified Google profile and
// links or creates the customer account by verified email.
// ============================================================

export const authenticateWithGoogle = async (code: string) => {
  const { clientId, clientSecret, redirectUri } = config.google;
  if (!clientId || !clientSecret) {
    throw ApiError.unauthorized('Google sign-in is not configured');
  }

  const exchangeParams = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: exchangeParams.toString(),
  });
  if (!tokenResponse.ok) {
    throw ApiError.unauthorized('Google sign-in failed — please try again');
  }
  const tokens = (await tokenResponse.json()) as { access_token?: string };
  if (!tokens.access_token) {
    throw ApiError.unauthorized('Google sign-in failed — please try again');
  }

  const userinfoResponse = await fetch(
    'https://openidconnect.googleapis.com/v1/userinfo',
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  );
  if (!userinfoResponse.ok) {
    throw ApiError.unauthorized('Google sign-in failed — please try again');
  }
  const profile = (await userinfoResponse.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };
  if (!profile.sub || !profile.email) {
    throw ApiError.unauthorized('Google sign-in failed — no verified account returned');
  }
  if (profile.email_verified !== true) {
    throw ApiError.badRequest('Your Google account email must be verified to sign in');
  }

  const email = profile.email.toLowerCase();
  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // Never reassign a Google identity that is already claimed under this
    // email, and never overwrite an existing password elsewhere.
    if (user.googleId && user.googleId !== profile.sub) {
      throw ApiError.conflict('This email is already linked to another account');
    }
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.sub,
          emailVerified: true,
          avatar: user.avatar || profile.picture || null,
        },
      });
    }
  } else {
    user = await prisma.user.create({
      data: {
        name: (profile.name || email.split('@')[0]).slice(0, 100),
        email,
        passwordHash: '',
        googleId: profile.sub,
        emailVerified: true,
        avatar: profile.picture || null,
      },
    });
  }

  return issueSession(user.id, user.role);
};
