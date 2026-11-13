import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'prisma'],
    environment: 'node',
    restoreMocks: true,
    // Never touch the live database: all DB interactions are mocked in tests.
    setupFiles: ['./vitest.setup.ts'],
  },
});