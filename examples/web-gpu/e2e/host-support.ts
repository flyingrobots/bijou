import { expect, type Page } from '@playwright/test';
import type { ShowcaseHost } from '../src/handoff.js';
import { countModel, waitFor } from './support.js';
// The probe's Window augmentation types every page.evaluate() below.
export type { ShowcaseProbe } from '../src/probe.js';

/** What lives in the Surface's mount host: the canvas mount's canvas and textarea, or the DOM mount's root. */
export async function liveMounts(page: Page): Promise<{ canvases: number; textareas: number; domRoots: number }> {
  return page.evaluate(() => {
    const host = document.querySelector('#surface');
    return {
      canvases: host?.querySelectorAll(':scope > canvas').length ?? -1,
      textareas: host?.querySelectorAll(':scope > textarea').length ?? -1,
      domRoots: host?.querySelectorAll(':scope > div').length ?? -1,
    };
  });
}

/** Exactly one mount, of `host`, is in the mount host. */
export async function expectOnly(page: Page, host: ShowcaseHost): Promise<void> {
  const expected = host === 'canvas' ? { canvases: 1, textareas: 1, domRoots: 0 } : { canvases: 0, textareas: 0, domRoots: 1 };
  expect(await liveMounts(page)).toEqual(expected);
}

/** Switch host through the probe, which runs on the session's queue, and wait for the new host to show the app. */
export async function switchHost(page: Page, host: ShowcaseHost): Promise<void> {
  await page.evaluate((next) => window.__bijouWebGpu?.switchHost(next), host);
  await waitFor(page, (current) => current.host === host && (host === 'dom' || current.presents > 0));
}

const node = (page: Page, id: string) => page.locator(`#surface [data-bijou-node-id="${id}"]`);

/** The count the DOM host shows. */
export const domCount = (page: Page) => node(page, 'app.count');

/** Press one of the app's own keys on the Surface. */
export async function pressOnCanvas(page: Page, key: string): Promise<void> {
  await page.locator('#surface textarea').focus();
  await page.keyboard.press(key);
}

/** Click one of the DOM host's Buttons. */
export async function clickInDom(page: Page, id: 'app.increment' | 'app.decrement'): Promise<void> {
  await node(page, id).click();
}

/** The model's count, from the live mount, and what the host shows for it. */
export async function expectCount(page: Page, host: ShowcaseHost, count: number): Promise<void> {
  await expect.poll(() => countModel(page)).toBe(count);
  if (host === 'dom') await expect(domCount(page)).toHaveText(`Count ${String(count)}`);
  await expect(page.locator('[data-hud="model"]')).toHaveText(new RegExp(`(?:^| )count ${String(count)}(?: |$)`, 'u'));
}
