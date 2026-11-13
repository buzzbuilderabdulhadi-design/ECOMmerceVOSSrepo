import crypto from 'crypto';
import config from '../config';
import { getRedisClient } from '../config/redis';
import logger from './logger';

// ============================================================
// Failed-login throttle (per account)
//
// The IP-based limiter on /auth/login stops a single host from spraying
// passwords, but it does nothing against a distributed attack aimed at ONE
// account. This counter adds a per-account backstop: after MAX failures
// within the window, further attempts for that account are rejected with 429
// before any bcrypt work is done.
//
// When REDIS_URL is configured the counter lives in Redis (atomic INCR +
// PEXPIRE), so every app instance enforces the same budget. Without Redis the
// original in-memory implementation is used; production startup refuses that
// path unless the operator explicitly opts into a single-instance deployment.
//
// Deliberate trade-offs:
//  - the window is short (15 min) so a legitimate owner who simply forgot
//    their password is never locked out for long, and a third party cannot
//    permanently deny service to an account.
//  - email addresses are hashed before becoming Redis keys.
//  - in-memory counters are pruned lazily so the map cannot grow unbounded.
// ============================================================

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;
const MAX_TRACKED_KEYS = 10_000;

const INCR_WITH_TTL = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return count
`;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function activeRedis() {
  return config.redis.url ? getRedisClient() : null;
}

function redisKey(email: string): string {
  const digest = crypto
    .createHash('sha256')
    .update(email.toLowerCase())
    .digest('hex');
  return `${config.rateLimit.keyPrefix}login-fail:${digest}`;
}

function prune(now: number): void {
  if (buckets.size < MAX_TRACKED_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
    if (buckets.size < MAX_TRACKED_KEYS) break;
  }
}

function memoryIsThrottled(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase();
  const bucket = buckets.get(key);
  if (!bucket) return false;
  if (bucket.resetAt <= now) {
    buckets.delete(key);
    return false;
  }
  return bucket.count >= MAX_FAILURES;
}

function memoryRecordFailure(email: string): void {
  const now = Date.now();
  const key = email.toLowerCase();
  prune(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  bucket.count += 1;
  if (bucket.count === MAX_FAILURES) {
    logger.warn('Account temporarily throttled after repeated failed logins', {
      account: maskEmail(key),
      failures: bucket.count,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    });
  }
}

export async function isLoginThrottled(email: string): Promise<boolean> {
  const client = activeRedis();
  if (client) {
    const value = await client.get(redisKey(email));
    return Number(value ?? 0) >= MAX_FAILURES;
  }
  return memoryIsThrottled(email);
}

export async function recordLoginFailure(email: string): Promise<void> {
  const client = activeRedis();
  if (client) {
    const count = Number(
      await client.eval(INCR_WITH_TTL, {
        keys: [redisKey(email)],
        arguments: [String(WINDOW_MS)],
      })
    );
    if (count === MAX_FAILURES) {
      logger.warn('Account temporarily throttled after repeated failed logins', {
        account: maskEmail(email),
        failures: count,
        retryAfterSeconds: Math.ceil(WINDOW_MS / 1000),
      });
    }
    return;
  }
  memoryRecordFailure(email);
}

export async function clearLoginFailures(email: string): Promise<void> {
  const client = activeRedis();
  if (client) {
    await client.del(redisKey(email));
  }
  buckets.delete(email.toLowerCase());
}

/** Keep addresses out of logs while still letting an operator correlate abuse. */
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return '***';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const head = local.slice(0, 1);
  return `${head}${'*'.repeat(Math.max(local.length - 1, 1))}@${domain}`;
}
