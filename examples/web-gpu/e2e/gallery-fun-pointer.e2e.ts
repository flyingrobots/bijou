import { expect, test, type Page } from '@playwright/test';
import { BACKENDS, focusSurface, hasWebGpu, stillFrame } from './gallery-fun-support.js';
import { expectDemoOpen, openGallery } from './gallery-support.js';
import { collectErrors, state } from './support.js';

// The metaballs follow the pointer with no button held. The session is paused, so only the pointer changes the frame.
async function cellCentre(page: Page, col: number, row: number): Promise<{ x: number; y: number }> {
  const box = await page.locator('#surface canvas').boundingBox();
  const grid = (await state(page)).grid;
  if (box === null || grid === null) throw new Error('no canvas is presenting');
  return { x: box.x + ((col + 0.5) * box.width) / grid.cols, y: box.y + ((row + 0.5) * box.height) / grid.rows };
}

async function hoverCell(page: Page, col: number, row: number, jitter = 0): Promise<string | null> {
  const at = await cellCentre(page, col, row);
  await page.mouse.move(at.x + jitter, at.y + jitter, { steps: 2 });
  await page.waitForTimeout(150);
  return stillFrame(page);
}

async function openPaused(page: Page, backend: string): Promise<{ cols: number; rows: number }> {
  await openGallery(page, `app=fun&backend=${backend}`);
  await expectDemoOpen(page, 'fun');
  await focusSurface(page);
  await page.keyboard.press('3');
  await page.keyboard.press('Space');
  const grid = (await state(page)).grid;
  if (grid === null) throw new Error('no grid');
  return grid;
}

for (const backend of BACKENDS) {
  for (const scale of [1, 2]) {
    test.describe(`${backend} at device scale ${String(scale)}`, () => {
      test.use({ deviceScaleFactor: scale });
      test(`the metaballs follow a pointer with no button held, by cell, and let go in the header row`, async ({ page }) => {
        const errors = collectErrors(page);
        await page.goto('/gallery.html?backend=canvas2d');
        test.skip(backend === 'webgpu' && !(await hasWebGpu(page)), 'This browser exposes no WebGPU adapter (capability-refused).');
        const grid = await openPaused(page, backend);
        const idle = await stillFrame(page);
        const middle = Math.floor(grid.cols / 2);
        const here = await hoverCell(page, middle, Math.floor(grid.rows / 2));
        expect(here).not.toBe(idle);
        // Another point of the same cell gives the same frame; the next cell over, another.
        expect(await hoverCell(page, middle, Math.floor(grid.rows / 2), 1)).toBe(here);
        expect(await hoverCell(page, middle + 3, Math.floor(grid.rows / 2))).not.toBe(here);
        // The last column is reached, not clamped short of it by a ratio of device pixels.
        const far = await hoverCell(page, grid.cols - 1, Math.floor(grid.rows / 2));
        expect(await hoverCell(page, grid.cols - 3, Math.floor(grid.rows / 2))).not.toBe(far);
        // The header row is outside the pane: the blob is let go, and the idle frame returns.
        expect(await hoverCell(page, middle, 0)).toBe(idle);
        expect(errors).toEqual([]);
      });
    });
  }
}
