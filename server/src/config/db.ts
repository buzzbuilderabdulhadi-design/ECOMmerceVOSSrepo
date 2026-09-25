import { PrismaClient } from '@prisma/client';
import config from './index';
import logger from '../utils/logger';

// ============================================================
// Prisma Database Connection Configuration
// ============================================================

let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

if (config.env === 'production') {
  prisma = new PrismaClient({
    log: ['error'],
  });
} else {
  // In development, use a global variable to preserve connection
  // across hot-reloads (e.g., with ts-node-dev)
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

// ============================================================
// Database Connection & Disconnection Helpers
// ============================================================

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
    logger.info(`Environment: ${config.env}`);
  } catch (error) {
    // Do not crash the server if the database is temporarily unreachable.
    // The API still starts, `/api/health` reports degraded, and the Prisma
    // client reconnects automatically once the database becomes reachable.
    logger.warn(
      'Database connection failed — starting server in degraded mode. ' +
        'All database-backed endpoints will return errors until connectivity is restored.'
    );
    if (config.env === 'development') {
      logger.warn(`Reason: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting database:', { error: String(error) });
  }
}

export default prisma;