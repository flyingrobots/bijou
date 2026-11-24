import type { ShowcaseBuild } from '../apps.js';
import { createBrowserDogfoodLocalePort } from '../dogfood/browser-locale.js';
import { SOAK_DEMO } from './soak-demo.js';

/** One demo of the gallery: what a person sees in the list, and how its code loads on demand. */
export interface GalleryDemo {
  /** The value of `?app=`: lower case, so it reads in an address. */
  readonly id: string;
  readonly title: string;
  /** One line, shown under the title. */
  readonly description: string;
  /** Import the demo's code, which no other chunk carries, and describe how to build it. */
  load(): Promise<ShowcaseBuild>;
}

/** The documentation app, loaded on demand with its document table. The locale choice stays in this port. */
export const DOGFOOD_DEMO: GalleryDemo = {
  id: 'dogfood',
  title: 'DOGFOOD',
  description: 'The Bijou documentation app: guides, component pages and themes, running on a canvas.',
  async load() {
    const { createDocsApp } = await import('@bijou-examples/docs');
    const localePort = createBrowserDogfoodLocalePort(navigator);
    return { build: (ctx) => createDocsApp(ctx, { localePort }) };
  },
};

/**
 * The bijou-fun shell and every demo in examples/fun/registry.ts, as one chunk. A demo added to that registry
 * appears here with no change to the showcase. The seed is the page's choice: demos never read the clock.
 */
export const FUN_DEMO: GalleryDemo = {
  id: 'fun',
  title: 'Bijou Fun',
  description: 'The bijou-fun demos in one shell: animated Surfaces that answer keys and follow the pointer.',
  async load() {
    const { funBuild } = await import('../../../fun/browser.js');
    return funBuild(Date.now() % 1_000_000);
  },
};

/** Every demo the gallery lists, in the order it lists them. One entry here is all a new demo needs. */
export const GALLERY_DEMOS: readonly GalleryDemo[] = [DOGFOOD_DEMO, SOAK_DEMO, FUN_DEMO];
