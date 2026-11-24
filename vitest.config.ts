import './scripts/docker-seal/require-docker.mjs';
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
      '@flyingrobots/bijou-i18n': fileURLToPath(
        new URL('./packages/bijou-i18n/src/index.ts', import.meta.url),
      ),
      '@flyingrobots/bijou-i18n-tools': fileURLToPath(
        new URL('./packages/bijou-i18n-tools/src/index.ts', import.meta.url),
      ),
      '@flyingrobots/bijou-i18n-tools-node': fileURLToPath(
        new URL('./packages/bijou-i18n-tools-node/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    include: ['packages/*/src/**/*.test.ts', 'bench/src/**/*.test.ts', 'scripts/**/*.test.ts', 'tests/**/*.test.ts'],
    // Every test file starts with no default context: see scripts/vitest-setup.ts.
    setupFiles: ['./scripts/vitest-setup.ts'],
    maxWorkers: 2,
    testTimeout: 60_000,
  },
});
