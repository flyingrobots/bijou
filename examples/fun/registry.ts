// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import type { DemoEntry } from './contract.js';
import { metaballsDemo } from './demos/metaballs.js';
import { rainbowGradient } from './demos/rainbow.js';
import { fontDemos } from './demos/fonts.js';
import { wormholeDemo } from './demos/wormhole.js';
import type { Typeface } from './demos/typeface.js';

/** The demos the shell lists, in order. Adding a demo is one line here. */
export const demos: readonly DemoEntry[] = [rainbowGradient, wormholeDemo, metaballsDemo];

/**
 * The demos that draw a font's outlines need the font's bytes, which only a host can supply, so they are not in `demos`.
 * A host loads a `Typeface` through its port (`loadTypeface`) and lists these after the others. With `NO_TYPEFACE`, or a
 * face that failed to load, each shows a message in its pane and the rest of the shell works.
 */
export function demosWithFonts(face: Typeface, message?: string): readonly DemoEntry[] {
  return [...demos, ...fontDemos(face, message)];
}
