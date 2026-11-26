import { readFileSync } from 'node:fs';
import type { DemoEntry, DemoMsg } from '../../examples/fun/contract.js';
import { fontRendererDemo } from '../../examples/fun/demos/font-renderer.js';
import { GREETING } from '../../examples/fun/demos/font-typing.js';
import { textCylinderDemo } from '../../examples/fun/demos/text-cylinder.js';
import { loadTypeface, type FontPort, type Typeface } from '../../examples/fun/demos/typeface.js';
import { pulses } from './fun-demos.js';

export { FONT_IDS } from './fun-demos.js';

export const FONT_FILE = new URL('../../assets/fonts/space-mono/SpaceMono-BoldItalic.ttf', import.meta.url);

/** What a terminal host does: read the file, by a path that does not depend on the working directory. */
export const fontPort: FontPort = () => Promise.resolve(readFileSync(FONT_FILE));
export const face = await loadTypeface(fontPort);

/** The two font demos drawing `typeface`, in the catalog's order. */
export function fontDemos(typeface: Typeface, message: string = GREETING): DemoEntry[] {
  return [fontRendererDemo(typeface, message), textCylinderDemo(typeface, message)];
}

export function fontEntry(id: string, message?: string): DemoEntry {
  const found = fontDemos(face, message).find((entry) => entry.id === id);
  if (found === undefined) throw new Error(`no font demo named ${id}`);
  return found;
}

export const key = (name: string): DemoMsg => ({ type: 'key', key: name });

/** The messages the recorded frames are made from: 30 pulses, clear the message, type `Bijou`, 30 more pulses. */
export function fontScript(): DemoMsg[] {
  return [...pulses(30), key('r'), key('i'), key('shift+b'), key('i'), key('j'), key('o'), key('u'), key('escape'), ...pulses(30)];
}
