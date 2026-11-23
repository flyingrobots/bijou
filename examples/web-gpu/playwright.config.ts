import { defineConfig } from '@playwright/test';

// Several worktrees may run this suite at once, so each picks its own port.
const port = process.env['BIJOU_WEB_GPU_PORT'] ?? '41797';
const origin = `http://127.0.0.1:${port}`;
// `chrome` is the installed Google Chrome, as hosted Ubuntu runners have;
// `chromium` is the browser `npx playwright install chromium` downloads.
const channel = process.env['BIJOU_WEB_GPU_BROWSER_CHANNEL'] ?? 'chrome';
const config = '--config examples/web-gpu/vite.config.ts';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  outputDir: '../../test-results/web-gpu',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: process.env['CI'] !== undefined,
  reporter: [['list']],
  use: {
    baseURL: origin,
    channel,
    viewport: { width: 1280, height: 900 },
    // Kept in outputDir, which the CI job uploads when the suite fails.
    trace: 'retain-on-failure',
  },
  webServer: {
    // Serve the production bundle, the artifact the sealed gate builds.
    command: `npx vite build ${config} && npx vite preview ${config} --port ${port}`,
    cwd: '../..',
    url: origin,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  // No device preset: its fixed user agent would replace the real browser's,
  // and the Canvas 2D receipt records the user agent as its driver.
  projects: [{ name: channel }],
});
