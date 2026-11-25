import { expect, test } from '@playwright/test';
import { BACKENDS, focusSurface, funCards, hasWebGpu, nextFrame, solo } from './gallery-fun-support.js';
import { expectDemoOpen, expectGalleryOnly, openGallery } from './gallery-support.js';
import { collectErrors, mounted, state } from './support.js';

// Each fun demo has a card and a page of its own, where it runs alone.
const BACK = { name: 'Back to the gallery' } as const;

for (const backend of BACKENDS) {
  test(`on ${backend} every fun demo opens from its card's address, advances with the clock, and the console stays clean`, async ({ page }) => {
    test.setTimeout(240_000);
    const errors = collectErrors(page);
    await openGallery(page, 'backend=canvas2d');
    test.skip(backend === 'webgpu' && !(await hasWebGpu(page)), 'This browser exposes no WebGPU adapter (capability-refused).');
    const ids = await funCards(page);
    for (const id of ids) {
      await openGallery(page, `app=${id}&backend=${backend}`);
      await expectDemoOpen(page, id);
      expect((await state(page)).backend, id).toBe(backend);
      const { frame } = await solo(page);
      // Not paused: the pulse alone moves the demo's clock on.
      await expect.poll(async () => (await solo(page)).frame, { message: id }).toBeGreaterThan(frame);
      expect(await page.evaluate(() => window.__bijouWebGpu?.failures()), id).toEqual([]);
      expect(await mounted(page), id).toMatchObject({ canvases: 1, textareas: 1 });
    }
    expect(errors).toEqual([]);
  });
}

test('the gallery shows a card per fun demo with a name and a description, opens one by click, and a reload opens the same demo', async ({ page }) => {
  const errors = collectErrors(page);
  await openGallery(page, 'backend=canvas2d');
  const ids = await funCards(page);
  expect(new Set(ids).size).toBe(ids.length);
  await expect(page.locator('[data-gallery-demo="fun"]')).toHaveCount(0);
  for (const id of ids) {
    const card = page.locator(`[data-gallery-demo="${id}"]`);
    await expect(card.locator('[data-slot="item-title"]')).not.toBeEmpty();
    await expect(card.locator('[data-slot="item-description"]')).not.toBeEmpty();
  }
  const last = ids.at(-1) ?? '';
  await page.locator(`[data-gallery-demo="${last}"]`).click();
  await expectDemoOpen(page, last);
  await page.reload();
  await expectDemoOpen(page, last);
  await page.getByRole('button', BACK).click();
  await expectGalleryOnly(page);
  expect(errors).toEqual([]);
});

test('a demo page has no demo switcher: the keys a shell would keep reach the demo, and the page stays on it', async ({ page }) => {
  const errors = collectErrors(page);
  await openGallery(page, 'app=fun-wormhole&backend=canvas2d');
  await expectDemoOpen(page, 'fun-wormhole');
  await focusSurface(page);
  expect((await solo(page)).holdsOtherDemos).toBe(false);
  for (const key of ['Tab', 'ArrowRight', 'ArrowLeft', '2', 'q']) await page.keyboard.press(key);
  await focusSurface(page);
  expect(new URL(page.url()).searchParams.get('app')).toBe('fun-wormhole');
  // Space reaches the session and pauses it; while paused only the demo's own key, `m`, changes the picture.
  await page.keyboard.press('Space');
  await expect.poll(async () => (await solo(page)).paused).toBe(true);
  const { frame } = await solo(page);
  const still = (await state(page)).frameRgbaSha256;
  await page.keyboard.press('m');
  await nextFrame(page, still);
  expect((await solo(page)).frame).toBe(frame);
  // `q` did not stop it: it runs on when resumed.
  await page.keyboard.press('Space');
  await expect.poll(async () => (await solo(page)).frame).toBeGreaterThan(frame);
  expect(await mounted(page)).toMatchObject({ canvases: 1, textareas: 1 });
  expect(errors).toEqual([]);
});
