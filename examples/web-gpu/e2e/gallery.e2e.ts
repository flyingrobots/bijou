import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { expectDemoOpen, expectGalleryOnly, openGallery } from './gallery-support.js';
import { collectErrors } from './support.js';

// The gallery page: a registry's demos listed, each opened on demand at its own URL.
const BACK = { name: 'Back to the gallery' } as const;
const demo = (page: Parameters<typeof openGallery>[0], id: string) => page.locator(`[data-gallery-demo="${id}"]`);

test('the gallery lists every registered demo, opens DOGFOOD at its URL, returns, and a reload of the URL opens the same demo', async ({ page }) => {
  const errors = collectErrors(page);
  await openGallery(page, 'backend=canvas2d');
  await expectGalleryOnly(page);
  await expect(page.locator('[data-gallery-demo]')).toHaveCount(1);
  await expect(demo(page, 'dogfood')).toContainText('DOGFOOD');
  await demo(page, 'dogfood').click();
  await expectDemoOpen(page, 'dogfood');
  expect(page.url()).toContain('app=dogfood');
  await page.getByRole('button', BACK).click();
  await expectGalleryOnly(page);
  expect(new URL(page.url()).searchParams.get('app')).toBeNull();
  await demo(page, 'dogfood').click();
  await expectDemoOpen(page, 'dogfood');
  await page.reload();
  await expectDemoOpen(page, 'dogfood');
  expect(await page.evaluate(() => window.__bijouWebGpu?.failures())).toEqual([]);
  expect(errors).toEqual([]);
});

test('an unknown app shows the gallery with a message that names it', async ({ page }) => {
  const errors = collectErrors(page);
  await openGallery(page, 'app=nope&backend=canvas2d');
  await expectGalleryOnly(page);
  await expect(page.locator('[data-gallery-message]')).toContainText('nope');
  await expect(page.locator('[data-gallery-message]')).toHaveAttribute('role', 'alert');
  await demo(page, 'dogfood').click();
  await expectDemoOpen(page, 'dogfood');
  expect(errors).toEqual([]);
});

test('a demo whose code cannot load shows the error in the page, and the gallery stays usable', async ({ page }) => {
  const manifest: Record<string, { file: string }> = JSON.parse(readFileSync(new URL('../dist/.vite/manifest.json', import.meta.url), 'utf8'));
  const chunk = manifest['../docs/app.ts']?.file;
  if (chunk === undefined) throw new Error('the build manifest has no chunk for the DOGFOOD app');
  await page.route(`**/${chunk}`, (route) => route.abort());
  await openGallery(page, 'app=dogfood&backend=canvas2d');
  const failure = page.locator('[data-demo-error]');
  await expect(failure).toBeVisible();
  await expect(failure).toContainText('Failed to fetch dynamically imported module');
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByRole('button', BACK).click();
  await expect(demo(page, 'dogfood')).toBeVisible();
  await page.unroute(`**/${chunk}`);
  await demo(page, 'dogfood').click();
  await expectDemoOpen(page, 'dogfood');
});

test('the back and forward buttons move between the gallery and the demo, leaving one canvas or none', async ({ page }) => {
  const errors = collectErrors(page);
  await openGallery(page, 'backend=canvas2d');
  await demo(page, 'dogfood').click();
  await expectDemoOpen(page, 'dogfood');
  await page.goBack();
  await expectGalleryOnly(page);
  await page.goForward();
  await expectDemoOpen(page, 'dogfood');
  await page.goBack();
  await expectGalleryOnly(page);
  expect(errors).toEqual([]);
});
