import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@flyingrobots/bijou/adapters/test': fileURLToPath(
        new URL('./packages/bijou/src/adapters/test/index.ts', import.meta.url),
      ),
      '@flyingrobots/bijou/perf': fileURLToPath(
        new URL('./packages/bijou/src/core/render/packed-cell.ts', import.meta.url),
      ),
      '@flyingrobots/bijou': fileURLToPath(
        new URL('./packages/bijou/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    include: ['packages/*/src/**/*.test.ts', 'bench/src/**/*.test.ts', 'scripts/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
