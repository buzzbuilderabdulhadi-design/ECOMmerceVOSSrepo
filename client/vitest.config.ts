import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    environment: 'jsdom',
    restoreMocks: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});