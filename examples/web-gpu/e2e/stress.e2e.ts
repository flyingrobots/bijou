import { expect, test } from '@playwright/test';
import { collectErrors, mounted, open, waitFor } from './support.js';

// The issue's fuzz case: toggle apps and backends ten times without waiting,
// then check that one canvas is left, the HUD is healthy and nothing was logged.
test('ten rapid app and backend toggles leave one canvas, one textarea and no error', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page, 'app=counter&backend=webgl2');
  const nodes: number[] = [];
  for (let round = 0; round < 10; round++) {
    await page.evaluate((index) => {
      const probe = window.__bijouWebGpu;
      void probe?.switchBackend(index % 2 === 0 ? 'canvas2d' : 'webgl2');
      void probe?.mountApp(index % 3 === 0 ? 'showcase' : 'counter', index % 2 === 0 ? 'webgl2' : 'canvas2d');
      void probe?.switchBackend(index % 2 === 0 ? 'canvas2d' : 'webgl2');
    }, round);
    nodes.push((await mounted(page)).nodes);
  }
  // Round 9 ends on the component showcase, mounted on Canvas 2D and switched to WebGL2.
  const settled = await waitFor(page, (current) => current.app === 'showcase' && current.backend === 'webgl2' && current.presents > 0);
  expect(settled.problem).toBeNull();
  // A failed toggle is kept even when a later mount clears the HUD's problem row.
  expect(await page.evaluate(() => window.__bijouWebGpu?.failures())).toEqual([]);
  expect(await mounted(page)).toEqual({ canvases: 1, textareas: 1, nodes: 2 });
  // While operations ran, the Surface never held more than an outgoing and an incoming canvas and the textarea.
  expect(Math.max(...nodes)).toBeLessThanOrEqual(3);
  expect(errors).toEqual([]);
});
