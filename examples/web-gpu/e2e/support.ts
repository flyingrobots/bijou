import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import type { HudState } from '../src/hud.js';
// The probe's Window augmentation types every page.evaluate() below.
export type { ShowcaseProbe } from '../src/probe.js';

declare global {
  interface Window {
    /** A canvas a test remembers, to tell a replaced canvas from the same one. */
    __previousCanvas?: Element | null;
    /** WebGL context events a test saw on the presenting canvas. */
    __contextEvents?: string[];
  }
}

/** The showcase's unset background, `SHOWCASE_DEFAULT_BG` (#0D1117), as RGBA. */
export const BACKGROUND = [0x0d, 0x11, 0x17, 255] as const;

/** Console errors and uncaught page errors, collected from the first navigation. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('pageerror', (error) => { errors.push(`pageerror: ${error.message}`); });
  return errors;
}

export async function state(page: Page): Promise<HudState> {
  return page.evaluate(async () => {
    const probe = window.__bijouWebGpu;
    if (probe === undefined) throw new Error(window.__bijouWebGpuError ?? 'the showcase probe is not installed');
    return probe.state();
  });
}

/** Wait until the HUD state satisfies `check`, and return that state. */
export async function waitFor(page: Page, check: (current: HudState) => boolean, timeout = 15_000): Promise<HudState> {
  let last: HudState | undefined;
  try {
    await expect.poll(async () => {
      last = await state(page);
      return check(last);
    }, { timeout }).toBe(true);
  } catch (error: unknown) {
    throw new Error(`the HUD state never matched; the last was ${JSON.stringify(last)}`, { cause: error });
  }
  if (last === undefined) throw new Error('no HUD state was read');
  return last;
}

/** Open the showcase and wait for a first presented frame. */
export async function open(page: Page, query: string): Promise<HudState> {
  await page.goto(`/?${query}`);
  await page.waitForFunction(() => window.__bijouWebGpu?.ready === true || window.__bijouWebGpuError !== undefined);
  return waitFor(page, (current) => current.presents > 0 || current.problem !== null);
}

/** One HUD row, as a person reads it. The HUD refreshes every 200 ms, so assert with retrying matchers. */
export function hud(page: Page, key: string): Locator {
  return page.locator(`[data-hud="${key}"]`);
}

export async function cellPixels(page: Page, col: number, row: number): Promise<number[]> {
  const pixels = await page.evaluate(([c, r]) => window.__bijouWebGpu?.cellPixels(c, r) ?? null, [col, row] as const);
  if (pixels === null) throw new Error('no canvas is presenting');
  return pixels;
}

/** Pixels of a cell that differ from the background. */
export function ink(pixels: readonly number[]): number {
  let count = 0;
  for (let offset = 0; offset < pixels.length; offset += 4) {
    if (BACKGROUND.some((channel, index) => pixels[offset + index] !== channel)) count += 1;
  }
  return count;
}

export async function countModel(page: Page): Promise<number> {
  return page.evaluate(() => {
    const model = window.__bijouWebGpu?.model();
    return typeof model === 'object' && model !== null && 'count' in model && typeof model.count === 'number' ? model.count : Number.NaN;
  });
}

/** Elements the mount added to the Surface container. */
export async function mounted(page: Page): Promise<{ canvases: number; textareas: number; nodes: number }> {
  return page.evaluate(() => {
    const surface = document.querySelector('#surface');
    return {
      canvases: surface?.querySelectorAll('canvas').length ?? -1,
      textareas: surface?.querySelectorAll('textarea').length ?? -1,
      nodes: surface?.querySelectorAll('*').length ?? -1,
    };
  });
}

/** Record which backend, adapter and evidence level produced a result. */
export function witness(info: TestInfo, current: HudState): void {
  const description = `${current.backend ?? 'none'} on ${current.adapter ?? 'no adapter'}: ${current.evidenceLevel ?? 'no receipt'}`;
  info.annotations.push({ type: 'evidence', description });
  process.stdout.write(`${JSON.stringify({ kind: 'web-gpu-evidence', test: info.title, backend: current.backend, adapter: current.adapter, evidenceLevel: current.evidenceLevel })}\n`);
}

/** The digit of `Count: N` in examples/counter: row 2, column 11 (box border, padding, two spaces, `Count: `). */
export const COUNTER_DIGIT = { col: 11, row: 2 } as const;
/** The `C` of `Count`, which no key press changes. */
export const COUNTER_LABEL = { col: 4, row: 2 } as const;
