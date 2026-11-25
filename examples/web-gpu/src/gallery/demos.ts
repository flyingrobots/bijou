import { catalog, type CatalogEntry } from '../../../fun/registry.js';
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
 * One gallery entry per demo of the fun catalog, each at `fun-<id>` and alone on its page. The catalog holds a demo's
 * name and description and how to load its module, so a demo added there appears here with no change to the showcase,
 * and opening one loads that demo's chunk and no other's. The seed is the page's choice: demos never read the clock.
 */
export function funGalleryDemos(entries: readonly CatalogEntry[] = catalog): GalleryDemo[] {
  return entries.map((item) => ({
    id: `fun-${item.id}`,
    title: item.name,
    description: item.description,
    async load() {
      const { loadSolo } = await import('../../../fun/browser.js');
      return loadSolo(item, Date.now() % 1_000_000);
    },
  }));
}

/** Every demo the gallery lists, in the order it lists them. */
export const GALLERY_DEMOS: readonly GalleryDemo[] = [DOGFOOD_DEMO, SOAK_DEMO, ...funGalleryDemos()];
