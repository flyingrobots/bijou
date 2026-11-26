import { expect, test, type Page } from '@playwright/test';
import { countListeners, expectDemoOpen, expectGalleryOnly, openGallery } from './gallery-support.js';
import { collectErrors } from './support.js';

const listeners = (page: Page) => page.evaluate(() => window.__listenerCount?.() ?? -1);

/** Stopping a demo finishes a moment after the page leaves it: the count when two reads, a beat apart, agree. */
async function settled(page: Page): Promise<number> {
  let last = -2;
  await expect.poll(async () => {
    const before = last;
    last = await listeners(page);
    await page.waitForTimeout(100);
    return last === before;
  }).toBe(true);
  return last;
}

async function cycle(page: Page): Promise<void> {
  await page.locator('[data-gallery-demo="dogfood"]').click();
  await expectDemoOpen(page, 'dogfood');
  await page.getByRole('button', { name: 'Back to the gallery' }).click();
  await expectGalleryOnly(page);
}

// Known failure modes: a second canvas left mounted after returning, and a
// demo's key handler (or any listener) still attached after it closed.
test('opening and closing DOGFOOD 50 times leaves one canvas while open, none after, and a stable listener count', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = collectErrors(page);
  await countListeners(page);
  await openGallery(page, 'backend=canvas2d');
  // The first visits load code and may add one-time listeners; the rest must return to what they left.
  await cycle(page);
  await cycle(page);
  const baseline = await settled(page);
  for (let visit = 0; visit < 48; visit += 1) {
    await cycle(page);
    // The canvas is gone at once; the listeners go as the stop finishes.
    await expect.poll(() => listeners(page)).toBe(baseline);
  }
  await page.locator('[data-gallery-demo="dogfood"]').click();
  await expectDemoOpen(page, 'dogfood');
  expect(await listeners(page)).toBeGreaterThan(baseline);
  expect(errors).toEqual([]);
});
