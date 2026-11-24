import { expect, test } from '@playwright/test';
import { activeIndex, BACKENDS, focusSurface, hasWebGpu, nextFrame } from './gallery-fun-support.js';
import { countListeners, expectDemoOpen, expectGalleryOnly, openGallery } from './gallery-support.js';
import { collectErrors, mounted, state, waitFor } from './support.js';

// The fun shell in the gallery: three demos behind one entry, each answering keys and the pointer.
for (const backend of BACKENDS) {
  test(`on ${backend} each fun demo opens, advances with the clock and the keys, and the console stays clean`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/gallery.html?backend=canvas2d');
    test.skip(backend === 'webgpu' && !(await hasWebGpu(page)), 'This browser exposes no WebGPU adapter (capability-refused).');
    await openGallery(page, `app=fun&backend=${backend}`);
    await expectDemoOpen(page, 'fun');
    expect((await state(page)).backend).toBe(backend);
    await focusSurface(page);
    let frame = (await state(page)).frameRgbaSha256;
    for (const [index, key] of ['1', '2', '3'].entries()) {
      await page.keyboard.press(key);
      await expect.poll(() => activeIndex(page)).toBe(index);
      frame = await nextFrame(page, frame);
      // Not paused: the pulse alone moves the picture on.
      frame = await nextFrame(page, frame);
    }
    // The wormhole answers `m` with another render mode.
    await page.keyboard.press('2');
    await page.keyboard.press('m');
    await nextFrame(page, frame);
    expect(await page.evaluate(() => window.__bijouWebGpu?.failures())).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('the gallery lists the fun shell and opens it by click', async ({ page }) => {
  const errors = collectErrors(page);
  await openGallery(page, 'backend=canvas2d');
  await expect(page.locator('[data-gallery-demo="fun"]')).toBeVisible();
  await page.locator('[data-gallery-demo="fun"]').click();
  await expectDemoOpen(page, 'fun');
  expect(errors).toEqual([]);
});

test('a backend switch while a demo runs keeps the shell on the same demo, still advancing', async ({ page }) => {
  const errors = collectErrors(page);
  await openGallery(page, 'app=fun&backend=webgl2');
  await expectDemoOpen(page, 'fun');
  await focusSurface(page);
  await page.keyboard.press('3');
  await expect.poll(() => activeIndex(page)).toBe(2);
  await page.evaluate(() => window.__bijouWebGpu?.switchBackend('canvas2d'));
  await waitFor(page, (current) => current.backend === 'canvas2d' && current.presents > 0);
  expect(await activeIndex(page)).toBe(2);
  expect(await mounted(page)).toMatchObject({ canvases: 1, textareas: 1 });
  await nextFrame(page, (await state(page)).frameRgbaSha256);
  expect(errors).toEqual([]);
});

test('switching demos 100 times leaves one canvas and a stable listener count', async ({ page }) => {
  const errors = collectErrors(page);
  await countListeners(page);
  await openGallery(page, 'app=fun&backend=canvas2d');
  await expectDemoOpen(page, 'fun');
  await focusSurface(page);
  const listeners = () => page.evaluate(() => window.__listenerCount?.() ?? -1);
  await page.keyboard.press('tab');
  const baseline = await listeners();
  for (let visit = 0; visit < 100; visit += 1) await page.keyboard.press('tab');
  await expect.poll(async () => (await mounted(page)).canvases).toBe(1);
  expect(await listeners()).toBe(baseline);
  expect(await activeIndex(page)).toBe(2);
  expect(errors).toEqual([]);
});

test('leaving the fun shell returns to the gallery with no canvas left', async ({ page }) => {
  await openGallery(page, 'app=fun&backend=canvas2d');
  await expectDemoOpen(page, 'fun');
  await page.getByRole('button', { name: 'Back to the gallery' }).click();
  await expectGalleryOnly(page);
});
