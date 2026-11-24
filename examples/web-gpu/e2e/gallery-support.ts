import { expect, type Page } from '@playwright/test';
import { waitFor } from './support.js';

declare global {
  interface Window {
    /** Event listeners added and not yet removed on any target, counted by the init script below. */
    __listenerCount?: () => number;
  }
}

/** Count every live event listener, so a demo that leaves a handler behind shows as a larger number. */
export async function countListeners(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const live = new Set<string>();
    const ids = new WeakMap<object, number>();
    const id = (value: object): number => {
      const known = ids.get(value);
      if (known !== undefined) return known;
      ids.set(value, ids.size + 1);
      return ids.size;
    };
    const key = (target: EventTarget, type: string, listener: object, options: unknown): string => {
      const capture = typeof options === 'boolean' ? options : typeof options === 'object' && options !== null && Reflect.get(options, 'capture') === true;
      return `${String(id(target))}:${type}:${String(id(listener))}:${String(capture)}`;
    };
    const { addEventListener, removeEventListener } = EventTarget.prototype;
    EventTarget.prototype.addEventListener = function patched(this: EventTarget, type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void {
      if (listener !== null) live.add(key(this, type, listener, options));
      addEventListener.call(this, type, listener, options);
    };
    EventTarget.prototype.removeEventListener = function patched(this: EventTarget, type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions): void {
      if (listener !== null) live.delete(key(this, type, listener, options));
      removeEventListener.call(this, type, listener, options);
    };
    window.__listenerCount = () => live.size;
  });
}

/** Open the gallery page, with the canvas 2D backend unless the query says otherwise. */
export async function openGallery(page: Page, query = ''): Promise<void> {
  await page.goto(`/gallery.html?${query}`);
}

/** A demo is open: its Surface holds one canvas and it has presented a frame. */
export async function expectDemoOpen(page: Page, app: string): Promise<void> {
  await page.waitForFunction(() => window.__bijouWebGpu?.ready === true || window.__bijouWebGpuError !== undefined);
  await waitFor(page, (current) => current.app === app && current.presents > 0);
  await expect(page.locator('#surface canvas')).toHaveCount(1);
  expect(new URL(page.url()).searchParams.get('app')).toBe(app);
}

/** The gallery is showing and nothing of a demo is left in the page. */
export async function expectGalleryOnly(page: Page): Promise<void> {
  await expect(page.locator('[data-gallery-demo]').first()).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('#surface')).toHaveCount(0);
  expect(await page.evaluate(() => window.__bijouWebGpu === undefined)).toBe(true);
}
