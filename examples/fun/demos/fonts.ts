// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import type { DemoEntry } from '../contract.js';
import { fontRendererDemo } from './font-renderer.js';
import { GREETING } from './font-typing.js';
import { textCylinderDemo } from './text-cylinder.js';
import type { Typeface } from './typeface.js';

/** The demos that draw a font's outlines. `message` is what they start with; a missing `face` shows a message in each pane. */
export function fontDemos(face: Typeface, message: string = GREETING): readonly DemoEntry[] {
  return [fontRendererDemo(face, message), textCylinderDemo(face, message)];
}
