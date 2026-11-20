import type { Server } from 'http';
import config, { validateConfig } from './config';
import { connectDatabase, disconnectDatabase } from './config/db';
import { connectRedis, disconnectRedis } from './config/redis';
import logger from './utils/logger';

// ============================================================
// Server bootstrap
//
// Startup order matters: the shared rate-limit store must be connected before
// the Express app is imported, because the limiter module constructs
// RedisStore instances (and RedisStore loads Lua scripts) at import time.
// Keeping this separate from app.ts lets tests import the app without
// starting listeners or opening external connections.
// ============================================================

let server: Server | undefined;
let shuttingDown = false;

function describeError(value: unknown): { message: string; stack?: string } {
  if (value instanceof Error) {
    return { message: value.message, stack: value.stack };
  }
  return { message: String(value) };
}

async function shutdown(exitCode = 0): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info('Shutting down ZOYA GOODS server...');

  if (server) {
    await new Promise<void>((resolve) => {
      server?.close(() => resolve());
    });
  }

  await disconnectRedis();
  await disconnectDatabase();
  process.exit(exitCode);
}

async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    validateConfig();
    await connectRedis();

    const { default: app } = await import('./app');

    server = app.listen(config.port, () => {
      logger.info(`🚀 ZOYA GOODS Server running on port ${config.port}`);
      logger.info(`🌍 Environment: ${config.env}`);
      logger.info(`🔗 Client URL: ${config.client.url}`);

      if (config.env === 'development') {
        logger.info(`📚 API Docs: http://localhost:${config.port}/api/health`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: describeError(error).message });
    await shutdown(1);
  }
}

process.on('unhandledRejection', (reason: unknown) => {
  const detail = describeError(reason);
  logger.error('Unhandled Rejection:', detail);
  void shutdown(1);
});

process.on('uncaughtException', (error: Error) => {
  const detail = describeError(error);
  logger.error('Uncaught Exception:', detail);
  void shutdown(1);
});

process.on('SIGTERM', () => {
  void shutdown();
});

process.on('SIGINT', () => {
  void shutdown();
});

void startServer();
