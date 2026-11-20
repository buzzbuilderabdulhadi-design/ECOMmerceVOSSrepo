import dotenv from 'dotenv';
import path from 'path';
import { normalizePaymentMethod, PaymentMethodValue, PAYMENT_METHOD } from '../constants/order';

// ============================================================
// Centralized Configuration — Load & Validate Environment Variables
// ============================================================

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  env: string;
  port: number;
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  client: {
    url: string;
  };
  cors: {
    allowedOrigins: string[];
  };
  cookie: {
    domain?: string;
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
  };
  trustProxy: number | boolean | string;
  redis: {
    url: string;
    allowMemoryStore: boolean;
    connectTimeoutMs: number;
  };
  cloudinary: {
    name: string;
    apiKey: string;
    apiSecret: string;
  };
  rateLimit: {
    windowMs: number;
    max: number;
    publicMax: number;
    keyPrefix: string;
    /**
     * When the counter store errors, allow the request through. Never enabled
     * in production: a broken shared store must fail closed, not silently
     * disable rate limiting across every instance.
     */
    passOnStoreError: boolean;
  };
  email: {
    service: string;
    user: string;
    password: string;
  };
  stripe: {
    secretKey: string;
    webhookSecret: string;
  };
  paypal: {
    clientId: string;
    clientSecret: string;
    environment: 'sandbox' | 'live';
    webhookId: string;
  };
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  bankTransfer: {
    enabled: boolean;
    bankName: string;
    accountTitle: string;
    iban: string;
    accountNumber: string;
    swift: string;
    branch: string;
    instructions: string;
  };
  payoneer: {
    enabled: boolean;
    accountEmail: string;
    instructions: string;
  };
  currency: string;
}

// `trust proxy` accepts a boolean, a hop count, or a subnet list. Default to a
// single trusted proxy (typical reverse-proxy deployment) and allow operators
// to override/disable it explicitly via TRUST_PROXY.
function parseTrustProxy(): number | boolean | string {
  const raw = process.env.TRUST_PROXY;
  if (raw === undefined || raw === '') return 1;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : raw;
}

/**
 * Normalize an origin to `scheme://host[:port]`. CSRF origin checks compare
 * exact normalized origins; paths, trailing slashes and casing never matter.
 */
function normalizeOrigin(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return `${url.protocol}//${url.host}`.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Browser origins allowed to make credentialed requests. `CLIENT_URL` is
 * always allowed; `ALLOWED_ORIGINS` can add extra storefront origins
 * (comma-separated). Development additionally allows the usual localhost
 * variants so the Next.js dev server works with either host spelling.
 */
function parseAllowedOrigins(clientUrl: string): string[] {
  const origins = new Set<string>();
  const clientOrigin = normalizeOrigin(clientUrl);
  if (clientOrigin) origins.add(clientOrigin);

  for (const raw of (process.env.ALLOWED_ORIGINS || '').split(',')) {
    const origin = normalizeOrigin(raw);
    if (origin) origins.add(origin);
  }

  if ((process.env.NODE_ENV || 'development') !== 'production') {
    for (const local of ['http://localhost:3000', 'http://127.0.0.1:3000']) {
      const origin = normalizeOrigin(local);
      if (origin) origins.add(origin);
    }
  }

  return [...origins];
}

const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/+$/, '');

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  database: {
    url:
      process.env.MONGODB_URI ||
      process.env.DATABASE_URL ||
      'mongodb://localhost:27017/voss_ecommerce',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  client: {
    url: clientUrl,
  },
  cors: {
    allowedOrigins: parseAllowedOrigins(clientUrl),
  },
  cookie: {
    // Optional cookie domain. Set `.example.com` when the storefront and API
    // live on sibling subdomains (store.example.com + api.example.com) so the
    // Next.js proxy can also see the HttpOnly session marker.
    domain: process.env.COOKIE_DOMAIN || undefined,
    // Secure cookies are required in production; allow an explicit override
    // only for unusual local HTTPS-terminating proxies.
    secure: process.env.COOKIE_SECURE === 'false' ? false : process.env.NODE_ENV === 'production',
    // `none` is only valid together with Secure and is required when the
    // storefront and API are on different registrable domains.
    sameSite: (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') || 'lax',
  },
  trustProxy: parseTrustProxy(),
  redis: {
    url: process.env.REDIS_URL || '',
    // Explicit single-instance escape hatch. Never a default: multi-instance
    // deployments would otherwise silently enforce per-instance limits.
    allowMemoryStore: process.env.RATE_LIMIT_ALLOW_MEMORY === 'true',
    connectTimeoutMs: parseInt(process.env.REDIS_CONNECT_TIMEOUT_MS || '5000', 10),
  },
  cloudinary: {
    name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    // Public API budget. Kept separate from the auth limiter so raising it can
    // never weaken authentication limits (auth stays at 20 / 15 min).
    publicMax: parseInt(process.env.RATE_LIMIT_PUBLIC_MAX || '1000', 10),
    keyPrefix: process.env.RATE_LIMIT_KEY_PREFIX || 'voss:rl:',
    passOnStoreError: (process.env.NODE_ENV || 'development') !== 'production',
  },
  email: {
    service: process.env.EMAIL_SERVICE || '',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    environment: process.env.PAYPAL_ENVIRONMENT === 'live' ? 'live' : 'sandbox',
    webhookId: process.env.PAYPAL_WEBHOOK_ID || '',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      ((process.env.NODE_ENV || 'development') === 'production'
        ? `${clientUrl}/auth/google/callback`
        : 'http://localhost:3000/auth/google/callback'),
  },
  bankTransfer: {
    enabled: process.env.BANK_TRANSFER_ENABLED === 'true',
    bankName: process.env.BANK_NAME || '',
    accountTitle: process.env.BANK_ACCOUNT_TITLE || '',
    iban: process.env.BANK_IBAN || '',
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || '',
    swift: process.env.BANK_SWIFT_CODE || '',
    branch: process.env.BANK_BRANCH || '',
    instructions: process.env.BANK_TRANSFER_INSTRUCTIONS || '',
  },
  payoneer: {
    enabled: process.env.PAYONEER_ENABLED !== 'false',
    accountEmail: process.env.PAYONEER_ACCOUNT_EMAIL || '',
    instructions: process.env.PAYONEER_INSTRUCTIONS || '',
  },
  currency: process.env.CURRENCY || 'usd',
};

// Validate required config
export function validateConfig(): void {
  const requiredInProduction = [
    ['JWT_SECRET', config.jwt.secret],
    ['JWT_REFRESH_SECRET', config.jwt.refreshSecret],
    ['CLOUDINARY_NAME', config.cloudinary.name],
    ['CLOUDINARY_API_KEY', config.cloudinary.apiKey],
    ['CLOUDINARY_API_SECRET', config.cloudinary.apiSecret],
    ['CLIENT_URL', config.client.url],
  ] as const;

  // Always require JWT secrets (even in development)
  const alwaysRequired: Array<[string, string]> = [
    ['JWT_SECRET', config.jwt.secret],
    ['JWT_REFRESH_SECRET', config.jwt.refreshSecret],
  ];

  for (const [name, value] of alwaysRequired) {
    if (!value || value.length < 32) {
      throw new Error(
        `Environment variable ${name} must be set and at least 32 characters long. ` +
        `Generate one with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
      );
    }
  }

  // Production-only checks
  if (!['lax', 'strict', 'none'].includes(config.cookie.sameSite)) {
    throw new Error(
      'Environment variable COOKIE_SAMESITE must be one of: lax, strict, none.'
    );
  }

  if (config.env === 'production') {
    const ttlMatch = /^(\d+)([smhd])$/.exec(config.jwt.expiresIn);
    const ttlMs = ttlMatch
      ? Number(ttlMatch[1]) * { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[ttlMatch[2] as 's' | 'm' | 'h' | 'd']
      : Number.POSITIVE_INFINITY;
    if (ttlMs > 60 * 60 * 1000) {
      throw new Error(
        'JWT_EXPIRES_IN must be at most 1h in production so access tokens can be revoked by expiring quickly. Use the default 15m.'
      );
    }

    const dbUrl = process.env.MONGODB_URI || process.env.DATABASE_URL || '';
    if (!dbUrl || dbUrl.startsWith('your_') || /localhost|127\.0\.0\.1/i.test(dbUrl)) {
      throw new Error(
        'Environment variable MONGODB_URI (or DATABASE_URL) must be set to the production MongoDB Atlas connection string. Localhost fallbacks are not allowed in production.'
      );
    }

    for (const [name, value] of requiredInProduction) {
      if (!value || value.startsWith('your_')) {
        throw new Error(
          `Missing or invalid required environment variable: ${name}`
        );
      }
    }

    // CORS origin must be a concrete origin, never a wildcard — with
    // credentials enabled, `origin: "*"` is both invalid and dangerous.
    if (config.client.url.includes('*')) {
      throw new Error(
        'Environment variable CLIENT_URL must be a concrete origin (e.g. https://zoyagoods.com). Wildcards are not allowed when credentials are enabled.'
      );
    }

    if (!/^https:\/\//i.test(config.client.url)) {
      throw new Error(
        'Environment variable CLIENT_URL must be an https:// origin in production so Secure cookies are accepted by browsers.'
      );
    }

    try {
      const redirect = new URL(config.google.redirectUri);
      if (redirect.protocol !== 'https:') {
        throw new Error('not https');
      }
      if (`${redirect.protocol}//${redirect.host}`.toLowerCase() !== config.client.url.toLowerCase()) {
        throw new Error('wrong origin');
      }
      if (redirect.pathname !== '/auth/google/callback') {
        throw new Error('wrong path');
      }
    } catch {
      throw new Error(
        'Google OAuth redirect URI must be https://<CLIENT_URL>/auth/google/callback in production. Set GOOGLE_REDIRECT_URI to that exact value if it is not derived automatically.'
      );
    }

    if (config.cookie.sameSite === 'none' && !config.cookie.secure) {
      throw new Error(
        'COOKIE_SAMESITE=none requires secure cookies. Set COOKIE_SECURE=true (or unset it in production).'
      );
    }

    // Shared rate-limit store: in-memory counters are per process, so multiple
    // app instances would each enforce a separate budget (effectively
    // multiplying every limit). Production must either point at Redis or
    // explicitly acknowledge the single-instance trade-off.
    if (!config.redis.url && !config.redis.allowMemoryStore) {
      throw new Error(
        'Environment variable REDIS_URL is required in production so rate limits are shared across app instances. ' +
        'For a deliberate single-instance deployment, set RATE_LIMIT_ALLOW_MEMORY=true.'
      );
    }

    if (config.redis.url && !/^rediss?:\/\//i.test(config.redis.url)) {
      throw new Error(
        'Environment variable REDIS_URL must use the redis:// or rediss:// scheme.'
      );
    }

    for (const origin of config.cors.allowedOrigins) {
      if (!/^https:\/\//i.test(origin)) {
        throw new Error(
          `Allowed browser origin must use https:// in production: ${origin}`
        );
      }
    }

    // Email: a half-configured mailbox silently drops every transactional
    // email at checkout. Require a complete pair (or none at all).
    const hasEmailUser = Boolean(config.email.user);
    const hasEmailPassword = Boolean(config.email.password);
    if (hasEmailUser !== hasEmailPassword) {
      throw new Error(
        'Environment variables EMAIL_USER and EMAIL_PASSWORD must be set together (or neither). A partial SMTP configuration silently drops all transactional email.'
      );
    }

    // Stripe: checkout is only "enabled" when BOTH the key and the webhook
    // secret exist. Otherwise asynchron-verified payments 503 forever.
    if (config.stripe.secretKey && !config.stripe.webhookSecret) {
      throw new Error(
        'Environment variable STRIPE_WEBHOOK_SECRET is required when STRIPE_SECRET_KEY is configured — webhook verification will fail without it.'
      );
    }
  }
}

// ============================================================
// Payment method availability
//
// A method is only advertised/usable when its provider is actually
// configured. Missing credentials must disable the method, never crash
// checkout. Credentials themselves are read from the server environment only
// and are never exposed to the client.
// ============================================================

export function isStripeConfigured(): boolean {
  return Boolean(config.stripe.secretKey);
}

export function isPaypalConfigured(): boolean {
  return Boolean(config.paypal.clientId && config.paypal.clientSecret);
}

export function isBankTransferConfigured(): boolean {
  return (
    config.bankTransfer.enabled &&
    Boolean(config.bankTransfer.bankName && config.bankTransfer.iban)
  );
}

export function isPayoneerConfigured(): boolean {
  return Boolean(config.payoneer.enabled && config.payoneer.accountEmail);
}

export function isGoogleConfigured(): boolean {
  return Boolean(config.google.clientId && config.google.clientSecret);
}

export function isEmailConfigured(): boolean {
  return Boolean(config.email.user && config.email.password);
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(config.cloudinary.name && config.cloudinary.apiKey && config.cloudinary.apiSecret);
}

export function isPaymentMethodConfigured(method: PaymentMethodValue): boolean {
  switch (method) {
    case PAYMENT_METHOD.STRIPE:
      return isStripeConfigured();
    case PAYMENT_METHOD.PAYPAL:
      return isPaypalConfigured();
    case PAYMENT_METHOD.BANK_TRANSFER:
      return isBankTransferConfigured();
    case PAYMENT_METHOD.PAYONEER:
      return isPayoneerConfigured();
    default:
      return false;
  }
}

/**
 * Join non-empty instruction lines so the stored env string can use newline
 * separators while remaining config-agnostic.
 */
export function joinInstructions(...lines: Array<string | undefined>): string {
  return lines.filter((line) => line && line.trim().length > 0).join('\n');
}

/**
 * Public (non-secret) instructions shown to the customer for manual methods.
 * Contains neither credentials nor provider secrets.
 */
export function getManualPaymentInstructions(method: PaymentMethodValue): string[] {
  const words = (text: string) => text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (method === PAYMENT_METHOD.BANK_TRANSFER) {
    return words(
      joinInstructions(
        config.bankTransfer.instructions,
        config.bankTransfer.bankName && `Bank: ${config.bankTransfer.bankName}`,
        config.bankTransfer.accountTitle && `Account name: ${config.bankTransfer.accountTitle}`,
        config.bankTransfer.iban && `IBAN: ${config.bankTransfer.iban}`,
        config.bankTransfer.accountNumber && `Account number: ${config.bankTransfer.accountNumber}`,
        config.bankTransfer.swift && `SWIFT/BIC: ${config.bankTransfer.swift}`,
        config.bankTransfer.branch && `Branch: ${config.bankTransfer.branch}`
      )
    );
  }
  if (method === PAYMENT_METHOD.PAYONEER) {
    return words(
      joinInstructions(
        config.payoneer.instructions,
        config.payoneer.accountEmail && `Payoneer account: ${config.payoneer.accountEmail}`,
        'Please include your order number as the payment reference.'
      )
    );
  }
  return [];
}

export default config;

