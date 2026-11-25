// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The browser entry: what a page that hosts one demo loads. It reaches no Node API, and it imports no demo: the
// catalog entry it is given loads its own.
import type { BijouContext } from '@flyingrobots/bijou';
import type { App } from '@flyingrobots/bijou-tui';
import type { FontPort } from './demos/typeface.js';
import type { CatalogEntry } from './registry.js';
import { createSoloApp, type SoloModel } from './solo.js';

/** What a page needs to mount a demo: how to build the app from the run's context. */
export interface FunBuild {
  readonly build: (ctx: BijouContext) => App<SoloModel>;
}

/** The browser's font port: fetch the file the bundler emits beside the page, by a URL from this module. */
export const fetchFont: FontPort = async () => {
  const response = await fetch(new URL('../../assets/fonts/space-mono/SpaceMono-BoldItalic.ttf', import.meta.url));
  if (!response.ok) throw new Error(`the font file answered ${String(response.status)}`);
  return response.arrayBuffer();
};

/**
 * One demo of the catalog, alone on the page: load its module, then build the solo app around it. The page chooses the
 * seed, since demos never read the clock. A demo that draws the font asks `font` for its bytes; a port that rejects
 * leaves that demo showing a message. A module that fails to load rejects, and the page reports it.
 */
export async function loadSolo(item: CatalogEntry, seed: number, font: FontPort = fetchFont): Promise<FunBuild> {
  const entry = await item.load({ font });
  return { build: (ctx) => createSoloApp({ ctx, entry, seed }) };
}
