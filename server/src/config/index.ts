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
  trustProxy: number | boolean | string;
  cloudinary: {
    name: string;
    apiKey: string;
    apiSecret: string;
  };
  rateLimit: {
    windowMs: number;
    max: number;
    publicMax: number;
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
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  client: {
    url: process.env.CLIENT_URL || 'http://localhost:3000',
  },
  trustProxy: parseTrustProxy(),
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
    ['DATABASE_URL', config.database.url],
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
  if (config.env === 'production') {
    for (const [name, value] of requiredInProduction) {
      if (!value || value.startsWith('your_')) {
        throw new Error(
          `Missing or invalid required environment variable: ${name}`
        );
      }
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

