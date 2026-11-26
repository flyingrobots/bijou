import { expect, type Page } from '@playwright/test';
import { state, waitFor } from './support.js';

export const BACKENDS = ['webgpu', 'canvas2d'] as const;

/** Whether this browser exposes a WebGPU adapter; without one a WebGPU case is skipped as capability-refused. */
export async function hasWebGpu(page: Page): Promise<boolean> {
  return page.evaluate(async () => {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    return gpu !== undefined && (await gpu.requestAdapter()) !== null;
  });
}

/** The ids of the fun demos' cards, as the gallery page lists them. The page is the only source: no test imports the catalog. */
export async function funCards(page: Page): Promise<string[]> {
  const ids = await page.locator('[data-gallery-demo^="fun-"]').evaluateAll((cards) => cards.map((card) => card.getAttribute('data-gallery-demo') ?? ''));
  expect(ids.length).toBeGreaterThan(0);
  return ids;
}

/** What the open demo's page holds, read from the live model: its one session, and whether anything lists other demos. */
export async function solo(page: Page): Promise<{ frame: number; paused: boolean; capturing: boolean; holdsOtherDemos: boolean }> {
  return page.evaluate(() => {
    const model = window.__bijouWebGpu?.model();
    const session: unknown = typeof model === 'object' && model !== null ? Reflect.get(model, 'session') : undefined;
    const read = (name: string): unknown => (typeof session === 'object' && session !== null ? Reflect.get(session, name) : undefined);
    const frame = read('frame');
    return {
      frame: typeof frame === 'number' ? frame : -1,
      paused: read('paused') === true,
      capturing: read('capturing') === true,
      // A shell's model holds an index and a list of sessions; a page for one demo holds one session.
      holdsOtherDemos: typeof model === 'object' && model !== null && ('index' in model || 'sessions' in model),
    };
  });
}

/** The chunk file the build manifest names for a module, by its path from the showcase's root. */
export function chunkOf(manifest: unknown, module: string): string {
  const item: unknown = typeof manifest === 'object' && manifest !== null ? Reflect.get(manifest, module) : undefined;
  const file: unknown = typeof item === 'object' && item !== null ? Reflect.get(item, 'file') : undefined;
  if (typeof file !== 'string') throw new Error(`the build manifest has no chunk for ${module}`);
  return file;
}

/** Give the Surface the keyboard, as a person does: focus its hidden textarea. */
export async function focusSurface(page: Page): Promise<void> {
  await page.locator('#surface textarea').focus();
}

/** The hash of the frame on screen once two reads a beat apart agree. */
export async function stillFrame(page: Page): Promise<string | null> {
  let last: string | null = 'none';
  await expect.poll(async () => {
    const before = last;
    last = (await state(page)).frameRgbaSha256;
    await page.waitForTimeout(150);
    return last === before;
  }, { timeout: 15_000 }).toBe(true);
  return last;
}

/** Wait until a new frame is on screen, and return its hash. */
export async function nextFrame(page: Page, previous: string | null): Promise<string | null> {
  return (await waitFor(page, (current) => current.frameRgbaSha256 !== previous && current.frameRgbaSha256 !== null)).frameRgbaSha256;
}
