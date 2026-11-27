// The Windows CI job's config. It is the one way tests run on Windows, and it
// runs them outside the sealed runner: see "Windows, outside the seal" in
// docs/guides/sealed-tests.md. It loads only in a GitHub-hosted Windows job,
// which runs on a fresh virtual machine; anywhere else, use the seal.
import { defineConfig } from 'vitest/config';
import { isGitHubHostedJob } from './docker-seal/github-hosted.mjs';
import { sharedVitestConfig } from './vitest-shared-config.js';
import { WINDOWS_TESTS } from './windows-tests.js';

if (process.platform !== 'win32' || !isGitHubHostedJob()) {
  throw new Error('scripts/vitest-windows.config.ts runs only in the Windows CI job. Use the sealed Docker runner.');
}

export default defineConfig({
  ...sharedVitestConfig,
  test: { ...sharedVitestConfig.test, include: [...WINDOWS_TESTS] },
});
