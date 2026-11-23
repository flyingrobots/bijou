import { expect, test } from '@playwright/test';
import {
  BACKGROUND, cellPixels, collectErrors, COUNTER_DIGIT, COUNTER_LABEL, countModel, hud, ink, mounted, open, state, waitFor, witness,
} from './support.js';

// The golden lifecycle of the issue's test plan, in one page: load, WebGL2
// pixels, a key press, a live switch to Canvas 2D, the other app, unmount.
test('counter on WebGL2 takes a key, keeps its state across a switch to Canvas 2D, then the app changes and unmounts', async ({ page }, info) => {
  const errors = collectErrors(page);
  const first = await open(page, 'app=counter&backend=webgl2');
  expect(first.problem).toBeNull();
  witness(page, info, first);

  // The HUD reports what the mount and the receipt say.
  await expect(hud(page, 'backend')).toHaveText('WebGL2');
  await expect(hud(page, 'fallback')).toHaveText('none');
  await expect(hud(page, 'grid')).toHaveText(`${String(first.grid?.cols)} × ${String(first.grid?.rows)}`);
  await expect(hud(page, 'cell')).toHaveText(`${String(first.cellPx.width)} × ${String(first.cellPx.height)} px`);
  await expect(hud(page, 'evidence')).toHaveText(/^(gpu|software)-probed$/u);
  await expect(hud(page, 'frame')).toHaveText(/^\d+\.\d\d ms \(\d+ frames\)$/u);
  const box = await page.locator('#surface canvas').boundingBox();
  if (box === null) throw new Error('the canvas has no box');
  expect(first.grid?.cols).toBe(Math.floor(Math.round(box.width * first.dpr) / first.cellPx.width));

  // Pixel probes: an empty cell is exactly the background; the digit and the label have ink.
  const empty = await cellPixels(page, (first.grid?.cols ?? 2) - 2, (first.grid?.rows ?? 2) - 2);
  expect(ink(empty)).toBe(0);
  expect(empty.slice(0, 4)).toEqual([...BACKGROUND]);
  const zero = await cellPixels(page, COUNTER_DIGIT.col, COUNTER_DIGIT.row);
  const label = await cellPixels(page, COUNTER_LABEL.col, COUNTER_LABEL.row);
  expect(ink(zero)).toBeGreaterThan(0);
  expect(ink(label)).toBeGreaterThan(0);

  // A real key press, through the hidden textarea the mount focuses on a click.
  await page.locator('#surface canvas').click();
  await page.keyboard.press('+');
  await expect.poll(() => countModel(page)).toBe(1);
  await expect.poll(async () => (await cellPixels(page, COUNTER_DIGIT.col, COUNTER_DIGIT.row)).join()).not.toBe(zero.join());
  const one = await cellPixels(page, COUNTER_DIGIT.col, COUNTER_DIGIT.row);
  expect(ink(one)).toBeGreaterThan(0);
  expect(await cellPixels(page, COUNTER_LABEL.col, COUNTER_LABEL.row)).toEqual(label);
  const webgl2 = await waitFor(page, (current) => current.frameRgbaSha256 !== first.frameRgbaSha256);

  // A live switch replaces the canvas and keeps the run, its model and keyboard focus.
  // It is driven through the page's probe: clicking a HUD button would move focus to the button.
  await page.evaluate(() => { window.__previousCanvas = document.querySelector('#surface canvas'); });
  await page.evaluate(() => window.__bijouWebGpu?.switchBackend('canvas2d'));
  const canvas2d = await waitFor(page, (current) => current.backend === 'canvas2d' && current.presents > 0);
  witness(page, info, canvas2d);
  await expect(hud(page, 'backend')).toHaveText('Canvas 2D');
  expect(await page.evaluate(() => window.__previousCanvas !== document.querySelector('#surface canvas'))).toBe(true);
  expect(await mounted(page)).toMatchObject({ canvases: 1, textareas: 1 });
  expect(await countModel(page)).toBe(1);
  expect(await cellPixels(page, COUNTER_DIGIT.col, COUNTER_DIGIT.row)).toEqual(one);
  // Both presenters follow Geordi's integer blend law: the frames are bit-identical.
  expect(canvas2d.frameRgbaSha256).toBe(webgl2.frameRgbaSha256);
  expect(await page.evaluate(() => document.activeElement === document.querySelector('#surface textarea'))).toBe(true);
  await page.keyboard.press('+');
  await expect.poll(() => countModel(page)).toBe(2);

  // The other app mounts in place of the counter; the app choice is a toggle group, one radio per app.
  await page.getByRole('radio', { name: 'Component showcase' }).click();
  const showcase = await waitFor(page, (current) => current.app === 'showcase' && current.presents > 0);
  expect(showcase.problem).toBeNull();
  await expect(hud(page, 'app')).toHaveText('showcase');
  expect(await mounted(page)).toMatchObject({ canvases: 1, textareas: 1 });

  // Unmount removes the canvas and the textarea.
  await page.evaluate(() => window.__bijouWebGpu?.unmount());
  expect(await mounted(page)).toEqual({ canvases: 0, textareas: 0, nodes: 0 });
  expect((await state(page)).problem).toBeNull();
  expect(errors).toEqual([]);
});

test('the HUD names the example apps that cannot be mounted unmodified, with their typed refusal', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page, 'app=counter&backend=canvas2d');
  await expect(page.locator('[data-refused="components"]')).toHaveText(
    'Components library: BIJOU_WEB_GPU_NODE_IMPORT: node:fs imported by examples/components/library-font.ts',
  );
  await expect(page.locator('[data-refused="hero"]')).toHaveText(
    'Hero: BIJOU_WEB_GPU_NODE_IMPORT: node:fs imported by examples/docs/app-cylinder-font.ts',
  );
  expect(errors).toEqual([]);
});
