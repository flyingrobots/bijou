import { createWebContext } from '@flyingrobots/bijou-web';
import type { GalleryDemo } from './demos.js';

declare global {
  interface Window {
    /** The soak bench's last log lines, oldest first; present only while the bench is open. */
    __bijouSoakLog?: () => readonly string[];
  }
}

/**
 * The soak bench, loaded on demand with its scenarios. Its options come from
 * the address's query; an invalid one rejects the load with its message, which
 * the gallery shows. The scenarios render with a browser context made from
 * `createWebContext()` of `@flyingrobots/bijou-web`: no test adapter, which
 * would pull `vitest` and `path` into the page.
 */
export const SOAK_DEMO: GalleryDemo = {
  id: 'soak',
  title: 'Soak bench',
  description: 'The Bijou soak bench: every benchmark scenario in turn on a canvas, with a frame-cost panel (toggle it with the backtick key).',
  async load() {
    const { createBrowserSoak } = await import('@bijou-examples/soak');
    const soak = createBrowserSoak(window.location.search, () => createWebContext({ mode: 'interactive' }));
    window.__bijouSoakLog = soak.lines;
    return { build: soak.app };
  },
};
