import { expect, test } from '@playwright/test';
import type { ShowcaseHost } from '../src/handoff.js';
import { clickInDom, expectCount, expectOnly, pressOnCanvas, switchHost } from './host-support.js';
import { collectErrors, open, waitFor } from './support.js';

// A seeded walk over host switches, presenter switches and input on whichever
// host is live. One model must survive all of it (flyingrobots/bijou#869).

const SEED = Number(process.env['BIJOU_HOST_STRESS_SEED'] ?? 869);
const STEPS = 36;

/** A small deterministic generator (mulberry32). */
function generator(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

test(`a seeded walk of ${String(STEPS)} host switches, presenter switches and inputs keeps one count`, async ({ page }) => {
  test.setTimeout(180_000);
  console.log(JSON.stringify({ kind: 'web-gpu-host-stress', seed: SEED, steps: STEPS }));
  const errors = collectErrors(page);
  const next = generator(SEED);
  await open(page, 'app=dual&backend=canvas2d');
  let host: ShowcaseHost = 'canvas';
  let backend: 'canvas2d' | 'webgl2' = 'canvas2d';
  let count = 0;
  const trail: string[] = [];
  for (let step = 0; step < STEPS; step++) {
    const roll = next();
    if (roll < 0.3) {
      host = host === 'canvas' ? 'dom' : 'canvas';
      trail.push(`host:${host}`);
      await switchHost(page, host);
    } else if (roll < 0.45 && host === 'canvas') {
      backend = backend === 'canvas2d' ? 'webgl2' : 'canvas2d';
      trail.push(`backend:${backend}`);
      const wanted = backend;
      await page.evaluate((name) => window.__bijouWebGpu?.switchBackend(name), wanted);
      await waitFor(page, (current) => current.backend === wanted && current.presents > 0);
    } else {
      const up = next() < 0.6;
      count += up ? 1 : -1;
      trail.push(`${host}:${up ? '+' : '-'}`);
      if (host === 'canvas') await pressOnCanvas(page, up ? 'k' : 'j');
      else await clickInDom(page, up ? 'app.increment' : 'app.decrement');
    }
    await expectCount(page, host, count);
    await expectOnly(page, host);
  }
  // The walk must have exercised both hosts and both kinds of input, or the seed proves little.
  expect(trail.filter((entry) => entry.startsWith('host:')).length).toBeGreaterThanOrEqual(6);
  expect(trail.some((entry) => entry.startsWith('dom:'))).toBe(true);
  expect(trail.some((entry) => entry.startsWith('canvas:'))).toBe(true);
  expect(await page.evaluate(() => window.__bijouWebGpu?.failures())).toEqual([]);
  expect(errors).toEqual([]);
});
