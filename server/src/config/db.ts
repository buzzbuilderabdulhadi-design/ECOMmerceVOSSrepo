import { PrismaClient } from '@prisma/client';
import config from './index';

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
    console.log('✅ Database connected successfully');
    console.log(`   Environment: ${config.env}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('🔌 Database disconnected');
  } catch (error) {
    console.error('Error disconnecting database:', error);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

export default prisma;

