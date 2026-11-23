import { expect, test } from '@playwright/test';
import { cellPixels, collectErrors, COUNTER_DIGIT, countModel, hud, ink, mounted, open, state, waitFor, witness } from './support.js';

test('with no WebGPU adapter and no WebGL2 context, auto falls back to Canvas 2D and the HUD names both reasons', async ({ page }, info) => {
  const errors = collectErrors(page);
  // A browser that refuses both: navigator.gpu is absent and getContext('webgl2') returns null.
  await page.addInitScript(() => {
    Reflect.deleteProperty(Navigator.prototype, 'gpu');
    const original: unknown = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'getContext')?.value;
    if (typeof original !== 'function') throw new Error('HTMLCanvasElement has no getContext');
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value(this: HTMLCanvasElement, type: string, options?: unknown): unknown {
        return type === 'webgl2' ? null : Reflect.apply(original, this, [type, options]);
      },
    });
  });
  const current = await open(page, 'app=counter&backend=auto');
  witness(page, info, current);
  expect(current.problem).toBeNull();
  expect(current.backend).toBe('canvas2d');
  expect(current.fallbackReasons.map((reason) => [reason.backend, reason.code])).toEqual([
    ['webgpu', 'GEORDI_E_BIJOU_BACKEND_UNAVAILABLE'],
    ['webgl2', 'GEORDI_E_BIJOU_BACKEND_UNAVAILABLE'],
  ]);
  await expect(hud(page, 'backend')).toHaveText('Canvas 2D');
  await expect(hud(page, 'fallback')).toHaveText(/^WebGPU: GEORDI_E_BIJOU_BACKEND_UNAVAILABLE \(.+\); WebGL2: GEORDI_E_BIJOU_BACKEND_UNAVAILABLE \(.+\)$/u);
  expect(ink(await cellPixels(page, COUNTER_DIGIT.col, COUNTER_DIGIT.row))).toBeGreaterThan(0);
  expect(await mounted(page)).toMatchObject({ canvases: 1, textareas: 1 });
  expect(errors).toEqual([]);
});

test('a WEBGL_lose_context loss and restore redraws the same frame without the app', async ({ page }, info) => {
  const errors = collectErrors(page);
  await open(page, 'app=counter&backend=webgl2');
  await page.locator('#surface canvas').click();
  await page.keyboard.press('+');
  await expect.poll(() => countModel(page)).toBe(1);
  const before = await waitFor(page, (current) => current.frameRgbaSha256 !== null && current.presents > 1);
  const digit = await cellPixels(page, COUNTER_DIGIT.col, COUNTER_DIGIT.row);
  const presents = before.presents;
  await page.evaluate(() => {
    window.__contextEvents = [];
    const canvas = document.querySelector('#surface canvas');
    for (const type of ['webglcontextlost', 'webglcontextrestored']) canvas?.addEventListener(type, () => { window.__contextEvents?.push(type); });
  });
  await page.getByRole('button', { name: 'Lose the WebGL2 context' }).click();
  await expect.poll(() => page.evaluate(() => window.__contextEvents)).toEqual(['webglcontextlost', 'webglcontextrestored']);
  const after = await waitFor(page, (current) => !current.contextLost);
  witness(page, info, after);
  expect(after.problem).toBeNull();
  expect(after.backend).toBe('webgl2');
  // The presenter redrew from its retained staging buffer: no new frame came from the app.
  expect(after.presents).toBe(presents);
  await expect.poll(() => cellPixels(page, COUNTER_DIGIT.col, COUNTER_DIGIT.row)).toEqual(digit);
  await expect(hud(page, 'context')).toHaveText('live');
  // The next app frames draw on the restored context and read back as before.
  await page.locator('#surface canvas').click();
  await page.keyboard.press('+');
  const two = await waitFor(page, (current) => current.presents > presents && current.frameRgbaSha256 !== before.frameRgbaSha256);
  await page.keyboard.press('-');
  const redrawn = await waitFor(page, (current) => current.presents > two.presents);
  expect(redrawn.frameRgbaSha256).toBe(before.frameRgbaSha256);
  expect(errors).toEqual([]);
});

test('resizing the viewport changes the grid the HUD reports', async ({ page }) => {
  const errors = collectErrors(page);
  const first = await open(page, 'app=counter&backend=canvas2d');
  await page.setViewportSize({ width: 900, height: 700 });
  const resized = await waitFor(page, (current) => current.grid?.cols !== first.grid?.cols);
  const box = await page.locator('#surface canvas').boundingBox();
  if (box === null || resized.grid === null) throw new Error('nothing is mounted');
  expect(resized.grid.cols).toBe(Math.floor(Math.round(box.width * resized.dpr) / resized.cellPx.width));
  expect(resized.grid.rows).toBe(Math.floor(Math.round(box.height * resized.dpr) / resized.cellPx.height));
  await expect(hud(page, 'grid')).toHaveText(`${String(resized.grid.cols)} × ${String(resized.grid.rows)}`);
  expect(errors).toEqual([]);
});

test('a forced glyph atlas reset starts a new generation and redraws the same pixels', async ({ page }) => {
  const errors = collectErrors(page);
  const first = await open(page, 'app=counter&backend=webgl2');
  const before = await waitFor(page, (current) => current.atlasGeneration !== null);
  await page.getByRole('button', { name: 'Reset the glyph atlas' }).click();
  // The atlas re-rasterizes on the next frame; a key press asks the app for one.
  await page.locator('#surface canvas').click();
  await page.keyboard.press('+');
  const after = await waitFor(page, (current) => (current.atlasGeneration ?? 0) > (before.atlasGeneration ?? 0) && current.presents > first.presents);
  await expect(hud(page, 'atlas')).toHaveText(String(after.atlasGeneration));
  await page.keyboard.press('-');
  const back = await waitFor(page, (current) => current.presents > after.presents);
  expect(back.frameRgbaSha256).toBe(before.frameRgbaSha256);
  expect((await state(page)).problem).toBeNull();
  expect(errors).toEqual([]);
});
