import { readFileSync } from 'node:fs';
import type { DemoEntry, DemoMsg } from '../../examples/fun/contract.js';
import { loadTypeface, type FontPort } from '../../examples/fun/demos/typeface.js';
import { demosWithFonts } from '../../examples/fun/registry.js';
import { pulses } from './fun-demos.js';

export const FONT_IDS = ['font-renderer', 'text-cylinder'] as const;
export const FONT_FILE = new URL('../../assets/fonts/space-mono/SpaceMono-BoldItalic.ttf', import.meta.url);

/** What a terminal host does: read the file, by a path that does not depend on the working directory. */
export const fontPort: FontPort = () => Promise.resolve(readFileSync(FONT_FILE));
export const face = await loadTypeface(fontPort);

export function fontEntry(id: string, message?: string): DemoEntry {
  const found = demosWithFonts(face, message).find((entry) => entry.id === id);
  if (found === undefined) throw new Error(`no font demo named ${id}`);
  return found;
}

export const key = (name: string): DemoMsg => ({ type: 'key', key: name });

/** The messages the recorded frames are made from: 30 pulses, clear the message, type `Bijou`, 30 more pulses. */
export function fontScript(): DemoMsg[] {
  return [...pulses(30), key('r'), key('i'), key('shift+b'), key('i'), key('j'), key('o'), key('u'), key('escape'), ...pulses(30)];
}
