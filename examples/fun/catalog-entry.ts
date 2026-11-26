// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import type { DemoEntry } from './contract.js';
import type { FontPort } from './demos/typeface.js';

/** What a host hands a demo that needs something from outside the program: the bytes of the font, through a port. */
export interface DemoHost {
  readonly font: FontPort;
}

/** One demo of the catalog: what a list shows before any demo's code has loaded, and how to load that code. */
export interface CatalogEntry {
  readonly id: string;
  readonly name: string;
  /** One line. */
  readonly description: string;
  /** True when the demo draws outlines of a font, and so waits on the font's bytes before it can paint. */
  readonly needsFont?: true;
  /** Import this demo's module, which no other entry imports, and build the demo. */
  load(host: DemoHost): Promise<DemoEntry>;
}
