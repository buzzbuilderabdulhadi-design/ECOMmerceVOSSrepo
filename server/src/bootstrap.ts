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

async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    validateConfig();
    await connectRedis();

    const { default: app } = await import('./app');

    app.listen(config.port, () => {
      logger.info(`🚀 ZOYA GOODS Server running on port ${config.port}`);
      logger.info(`🌍 Environment: ${config.env}`);
      logger.info(`🔗 Client URL: ${config.client.url}`);

      if (config.env === 'development') {
        logger.info(`📚 API Docs: http://localhost:${config.port}/api/health`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: String(error) });
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', { error: reason.message, stack: reason.stack });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await disconnectRedis();
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await disconnectRedis();
  await disconnectDatabase();
  process.exit(0);
});

void startServer();
