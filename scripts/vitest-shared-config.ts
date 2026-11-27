import { fileURLToPath } from 'node:url';
import type { ViteUserConfig } from 'vitest/config';

const repo = (path: string): string => fileURLToPath(new URL(`../${path}`, import.meta.url));

/** The suite's Vitest settings, shared by the sealed config and the Windows CI config. */
export const sharedVitestConfig = {
  root: repo(''),
  resolve: {
    alias: {
      '@flyingrobots/bijou/adapters/test': repo('packages/bijou/src/adapters/test/index.ts'),
      '@flyingrobots/bijou/perf': repo('packages/bijou/src/core/render/packed-cell.ts'),
      '@flyingrobots/bijou': repo('packages/bijou/src/index.ts'),
      '@flyingrobots/bijou-i18n': repo('packages/bijou-i18n/src/index.ts'),
      '@flyingrobots/bijou-i18n-tools': repo('packages/bijou-i18n-tools/src/index.ts'),
      '@flyingrobots/bijou-i18n-tools-node': repo('packages/bijou-i18n-tools-node/src/index.ts'),
    },
  },
  test: {
    include: ['packages/*/src/**/*.test.ts', 'bench/src/**/*.test.ts', 'scripts/**/*.test.ts', 'tests/**/*.test.ts'],
    // Every test file starts with no default context: see scripts/vitest-setup.ts.
    setupFiles: ['./scripts/vitest-setup.ts'],
    maxWorkers: 2,
    testTimeout: 60_000,
  },
} satisfies ViteUserConfig;
