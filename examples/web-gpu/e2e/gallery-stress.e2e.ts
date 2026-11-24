import { expect, test } from '@playwright/test';
import { countListeners, expectDemoOpen, expectGalleryOnly, openGallery } from './gallery-support.js';
import { collectErrors } from './support.js';

// Known failure modes: a second canvas left mounted after returning, and a
// demo's key handler (or any listener) still attached after it closed.
test('opening and closing DOGFOOD 50 times leaves one canvas while open, none after, and a stable listener count', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = collectErrors(page);
  await countListeners(page);
  await openGallery(page, 'backend=canvas2d');
  const listeners = () => page.evaluate(() => window.__listenerCount?.() ?? -1);
  const afterClose: number[] = [];
  const whileOpen: number[] = [];
  for (let cycle = 0; cycle < 50; cycle += 1) {
    await page.locator('[data-gallery-demo="dogfood"]').click();
    await expectDemoOpen(page, 'dogfood');
    whileOpen.push(await listeners());
    await page.getByRole('button', { name: 'Back to the gallery' }).click();
    await expectGalleryOnly(page);
    afterClose.push(await listeners());
  }
  // The first cycle may load code and add one-time listeners: the rest must not move.
  expect(new Set(afterClose.slice(2)).size).toBe(1);
  expect(new Set(whileOpen.slice(2)).size).toBe(1);
  expect(afterClose[49]).toBeLessThan(whileOpen[49] ?? 0);
  expect(errors).toEqual([]);
});
