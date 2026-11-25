import { expect, test, type Page } from '@playwright/test';
import { BACKENDS, focusSurface, hasWebGpu, nextFrame, solo } from './gallery-fun-support.js';
import { expectDemoOpen, openGallery } from './gallery-support.js';
import { collectErrors, state } from './support.js';

/** Every third cell, by row and column, with a vivid, bright pixel: the colour-animated braille of a font demo. The ground and the HUD card are neutral. */
async function vividCells(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const probe = window.__bijouWebGpu;
    const grid = probe === undefined ? null : (await probe.state()).grid;
    if (probe === undefined || grid === null) return -1;
    let cells = 0;
    for (let row = 0; row < grid.rows; row += 3) {
      for (let col = 0; col < grid.cols; col += 3) {
        const pixels = probe.cellPixels(col, row) ?? [];
        for (let at = 0; at < pixels.length; at += 4) {
          const channels = [pixels[at] ?? 0, pixels[at + 1] ?? 0, pixels[at + 2] ?? 0];
          if (Math.max(...channels) > 140 && Math.max(...channels) - Math.min(...channels) > 100) { cells += 1; break; }
        }
      }
    }
    return cells;
  });
}

/**
 * Where the canvas can be read back, colour proves the outlines are drawn. A WebGPU canvas cannot be read back by a
 * scratch canvas, so there the picture must change with each edit instead.
 */
async function expectInk(page: Page, readable: boolean, atLeast: number, previous: string | null): Promise<string | null> {
  if (readable) await expect.poll(() => vividCells(page), { timeout: 15_000 }).toBeGreaterThan(atLeast);
  return nextFrame(page, previous);
}

const FONT_DEMOS = ['font-renderer', 'text-cylinder'] as const;

for (const backend of BACKENDS) {
  for (const id of FONT_DEMOS) {
    test(`on ${backend} the ${id} demo draws its text from the fetched font, takes typing, and the console stays clean`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto('/gallery.html?backend=canvas2d');
      test.skip(backend === 'webgpu' && !(await hasWebGpu(page)), 'This browser exposes no WebGPU adapter (capability-refused).');
      await openGallery(page, `app=fun-${id}&backend=${backend}`);
      await expectDemoOpen(page, `fun-${id}`);
      await focusSurface(page);
      // Hide the HUD card, so that colour in the pane can only be the font's outlines.
      await page.keyboard.press('h');
      const readable = backend === 'canvas2d';
      const frame = await expectInk(page, readable, 3, (await state(page)).frameRgbaSha256);
      // Typing takes every key, digits, q and space included, and escape ends it.
      await page.keyboard.press('r');
      await page.keyboard.press('i');
      await expect.poll(async () => (await solo(page)).capturing).toBe(true);
      await page.keyboard.press('2');
      await page.keyboard.press('q');
      await page.keyboard.press('Space');
      await page.keyboard.press('w');
      expect((await solo(page)).paused).toBe(false);
      await expectInk(page, readable, 1, frame);
      await page.keyboard.press('Escape');
      await expect.poll(async () => (await solo(page)).capturing).toBe(false);
      expect(new URL(page.url()).searchParams.get('app')).toBe(`fun-${id}`);
      expect(await page.evaluate(() => window.__bijouWebGpu?.failures())).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}
