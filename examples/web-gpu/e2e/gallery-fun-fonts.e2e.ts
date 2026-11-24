import { expect, test, type Page } from '@playwright/test';
import { activeIndex, BACKENDS, focusSurface, hasWebGpu, nextFrame } from './gallery-fun-support.js';
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

async function sessionCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const model = window.__bijouWebGpu?.model();
    const sessions: unknown = typeof model === 'object' && model !== null ? Reflect.get(model, 'sessions') : undefined;
    return Array.isArray(sessions) ? sessions.length : -1;
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

/** Whether the active session is taking text: only the font demos ever do. */
async function capturing(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const model = window.__bijouWebGpu?.model();
    const sessions: unknown = typeof model === 'object' && model !== null ? Reflect.get(model, 'sessions') : undefined;
    const index: unknown = typeof model === 'object' && model !== null ? Reflect.get(model, 'index') : undefined;
    const session: unknown = Array.isArray(sessions) && typeof index === 'number' ? sessions[index] : undefined;
    return typeof session === 'object' && session !== null && Reflect.get(session, 'capturing') === true;
  });
}

/**
 * Where the font demos are, read from the running shell: step through every demo, press `i`, and note the ones that
 * then take text. The page is the only source, so the test names no module of the demos.
 */
async function fontPlaces(page: Page, count: number): Promise<number[]> {
  const places: number[] = [];
  for (let at = 0; at < count; at += 1) {
    await expect.poll(() => activeIndex(page)).toBe(at);
    await page.keyboard.press('i');
    if (await capturing(page)) {
      places.push(at);
      await page.keyboard.press('Escape');
    }
    if (at < count - 1) await page.keyboard.press('ArrowRight');
  }
  return places;
}

/** Walk right, wrapping, until the shell shows the demo at `target`. */
async function walkTo(page: Page, target: number, count: number): Promise<void> {
  for (let step = 0; step < count && (await activeIndex(page)) !== target; step += 1) await page.keyboard.press('ArrowRight');
  await expect.poll(() => activeIndex(page)).toBe(target);
}

const FONT_DEMOS = [{ id: 'font-renderer', nth: 0 }, { id: 'text-cylinder', nth: 1 }] as const;

for (const backend of BACKENDS) {
  for (const demo of FONT_DEMOS) {
    test(`on ${backend} the ${demo.id} demo draws its text from the fetched font, takes typing, and the console stays clean`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto('/gallery.html?backend=canvas2d');
      test.skip(backend === 'webgpu' && !(await hasWebGpu(page)), 'This browser exposes no WebGPU adapter (capability-refused).');
      await openGallery(page, `app=fun&backend=${backend}`);
      await expectDemoOpen(page, 'fun');
      await focusSurface(page);
      const count = await sessionCount(page);
      const places = await fontPlaces(page, count);
      expect(places).toHaveLength(FONT_DEMOS.length);
      const place = places[demo.nth] ?? -1;
      await walkTo(page, place, count);
      // Hide the HUD card, so that colour in the pane can only be the font's outlines.
      await page.keyboard.press('h');
      const readable = backend === 'canvas2d';
      const frame = await expectInk(page, readable, 3, (await state(page)).frameRgbaSha256);
      // Typing takes every key, digits and q included, and escape gives the shell its keys back.
      await page.keyboard.press('r');
      await page.keyboard.press('i');
      await page.keyboard.press('2');
      await page.keyboard.press('q');
      await page.keyboard.press('w');
      expect(await activeIndex(page)).toBe(place);
      await expectInk(page, readable, 1, frame);
      await page.keyboard.press('Escape');
      await page.keyboard.press('1');
      await expect.poll(() => activeIndex(page)).toBe(0);
      expect(await page.evaluate(() => window.__bijouWebGpu?.failures())).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}
