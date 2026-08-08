import dotenv from 'dotenv';
import path from 'path';

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
    expiresIn: string;
    refreshExpiresIn: string;
  };
  client: {
    url: string;
  };
  cloudinary: {
    name: string;
    apiKey: string;
    apiSecret: string;
  };
  rateLimit: {
    windowMs: number;
    max: number;
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
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/voss_ecommerce',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'voss_dev_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  client: {
    url: process.env.CLIENT_URL || 'http://localhost:3000',
  },
  cloudinary: {
    name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
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
};

// Validate required config in production
export function validateConfig(): void {
  if (config.env === 'production') {
    const required = [
      ['JWT_SECRET', config.jwt.secret],
      ['DATABASE_URL', config.database.url],
      ['CLOUDINARY_NAME', config.cloudinary.name],
      ['CLOUDINARY_API_KEY', config.cloudinary.apiKey],
      ['CLOUDINARY_API_SECRET', config.cloudinary.apiSecret],
      ['CLIENT_URL', config.client.url],
    ] as const;

    for (const [name, value] of required) {
      if (!value || value.startsWith('your_')) {
        throw new Error(
          `Missing or invalid required environment variable: ${name}`
        );
      }
    }
  }
}

export default config;

