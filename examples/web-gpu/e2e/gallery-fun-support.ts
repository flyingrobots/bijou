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

/** The shell's active demo, read from the live model. */
export async function activeIndex(page: Page): Promise<number> {
  return page.evaluate(() => {
    const model = window.__bijouWebGpu?.model();
    return typeof model === 'object' && model !== null && 'index' in model && typeof model.index === 'number' ? model.index : -1;
  });
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
