import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/integration/**/*.test.ts'],
    coverage: {
      enabled: false,
    },
    testTimeout: 60000,
    globals: true,
  },
});
