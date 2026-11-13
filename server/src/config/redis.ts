import { createClient } from 'redis';
import config from './index';
import logger from '../utils/logger';

type AppRedisClient = ReturnType<typeof createClient>;

// ============================================================
// Shared Redis client
//
// Used by the rate-limiting stores and the per-account login throttle so every
// app instance sees the same counters. The client is optional in local
// development; production startup fails unless REDIS_URL is configured (or the
// operator explicitly opts into single-instance memory stores).
// ============================================================

function buildClient(): AppRedisClient {
  const redis = createClient({
    url: config.redis.url,
    socket: {
      connectTimeout: config.redis.connectTimeoutMs,
      // Bound the initial connection attempt so a bad REDIS_URL fails
      // startup instead of hanging forever.
      reconnectStrategy: (retries) => {
        if (retries > 3) return new Error('Redis reconnect limit reached');
        return Math.min(retries * 250, 1000);
      },
    },
  });
  redis.on('error', (error) => {
    logger.error('Redis client error', { error: String(error) });
  });
  return redis;
}

let client: AppRedisClient | null = config.redis.url ? buildClient() : null;
let connecting: Promise<void> | null = null;

export function isRedisConfigured(): boolean {
  return Boolean(config.redis.url);
}

/**
 * Returns the live client. `null` means this process is deliberately running
 * without Redis (development, or an explicit single-instance production
 * opt-in) — never a silent fallback for a configured-but-broken deployment.
 */
export function getRedisClient(): AppRedisClient | null {
  return client;
}

export async function connectRedis(): Promise<void> {
  if (!config.redis.url) {
    if (config.env === 'production' && !config.redis.allowMemoryStore) {
      throw new Error(
        'REDIS_URL is required in production for shared rate limiting.'
      );
    }
    if (config.env === 'production') {
      logger.warn(
        'RATE_LIMIT_ALLOW_MEMORY=true — rate limits are per-process and are NOT shared across instances.'
      );
    }
    return;
  }

  if (client?.isReady) return;

  // The client is normally created at module load so limiters can reference
  // it during construction; recreate defensively if a previous connect failed.
  if (!client) {
    client = buildClient();
  }

  if (!connecting) {
    connecting = client.connect()
      .then(() => {
        logger.info('Redis connected — rate limits are shared across instances');
      })
      .catch((error) => {
        try {
          client?.disconnect();
        } catch {
          // Ignore teardown errors; the original connection error is what
          // the operator needs to see.
        }
        client = null;
        connecting = null;
        throw error;
      });
  }

  await connecting;
}

export async function disconnectRedis(): Promise<void> {
  const active = client;
  client = null;
  connecting = null;
  if (!active) return;
  try {
    if (active.isOpen) {
      await active.quit();
    } else {
      active.disconnect();
    }
  } catch (error) {
    logger.warn('Redis shutdown error', { error: String(error) });
  }
}
