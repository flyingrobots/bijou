import { expect, test, type Page } from '@playwright/test';
import { funCards } from './gallery-fun-support.js';
import { countListeners, expectDemoOpen, expectGalleryOnly, openGallery } from './gallery-support.js';
import { collectErrors, mounted } from './support.js';

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

async function cycle(page: Page, id: string): Promise<void> {
  await page.locator(`[data-gallery-demo="${id}"]`).click();
  await expectDemoOpen(page, id);
  expect((await mounted(page)).canvases).toBe(1);
  await page.getByRole('button', { name: 'Back to the gallery' }).click();
  await expectGalleryOnly(page);
}

// Known failure modes: a demo's listeners left attached after returning to the gallery, and a second canvas left mounted.
test('opening and closing each fun demo 20 times leaves one canvas while open, none after, and a stable listener count', async ({ page }) => {
  test.setTimeout(900_000);
  const errors = collectErrors(page);
  await countListeners(page);
  await openGallery(page, 'backend=canvas2d');
  for (const id of await funCards(page)) {
    // The first visits load the demo's code and may add one-time listeners; the rest must return to what they left.
    await cycle(page, id);
    await cycle(page, id);
    const baseline = await settled(page);
    for (let visit = 0; visit < 18; visit += 1) {
      await cycle(page, id);
      await expect.poll(() => listeners(page), { message: `${id}, visit ${String(visit + 3)}` }).toBe(baseline);
    }
  }
  expect(errors).toEqual([]);
});
