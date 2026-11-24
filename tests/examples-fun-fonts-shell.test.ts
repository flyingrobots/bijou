import { describe, expect, it } from 'vitest';
import type { Surface } from '@flyingrobots/bijou';
import type { KeyMsg } from '@flyingrobots/bijou-tui';
import { createFunApp } from '../examples/fun/shell.js';
import { loadTypeface, NO_TYPEFACE } from '../examples/fun/demos/typeface.js';
import { demosWithFonts } from '../examples/fun/registry.js';
import { SEED, cellsOf, funContext } from './helpers/fun-demos.js';
import { face } from './helpers/fun-font.js';

const ctx = funContext(100, 30);
const keyMsg = (name: string, extra: Partial<KeyMsg> = {}): KeyMsg => ({ type: 'key', key: name, ctrl: false, alt: false, shift: false, ...extra });

function rowText(surface: Surface, row: number): string {
  return cellsOf(surface).slice(row * surface.width, (row + 1) * surface.width).map((cell) => cell.char).join('');
}

const FIRST = 'font-renderer';

/** Open the shell on the font renderer, then send `keys`: the view, the model and every command the shell gave. */
function play(keys: readonly KeyMsg[], entries = demosWithFonts(face)) {
  const app = createFunApp({ ctx, entries, seed: SEED });
  const at = entries.findIndex((entry) => entry.id === FIRST);
  let [model] = app.init();
  const commands: unknown[] = [];
  for (const msg of [keyMsg(String(at + 1)), ...keys]) {
    const [next, cmds] = app.update(msg, model);
    model = next;
    commands.push(...cmds);
  }
  const view = app.view(model);
  if (!('cells' in view)) throw new Error('the shell must return a Surface');
  return { view, model, commands, at };
}

describe('the shell while a demo is taking text', () => {
  it('sends q, digits, tab, arrows and space to the demo, and shift letters as shift+letter', () => {
    const typed = play([keyMsg('i'), keyMsg('r'), keyMsg('q'), keyMsg('2'), keyMsg('tab'), keyMsg('left'), keyMsg('space'), keyMsg('b', { shift: true })]);
    expect(typed.commands).toEqual([]);
    expect(typed.model.index).toBe(typed.at);
    expect(rowText(typed.view, 0)).toContain('TTF Font Vector Renderer');
  });

  it('still quits on ctrl+c, and takes its own keys back on escape', () => {
    expect(play([keyMsg('i'), keyMsg('c', { ctrl: true })]).commands).toHaveLength(1);
    expect(play([keyMsg('i'), keyMsg('escape'), keyMsg('q')]).commands).toHaveLength(1);
  });

  it('names the demo keys in the footer', () => {
    expect(rowText(play([]).view, 29)).toContain('i type');
  });
});

describe('the shell with no font', () => {
  it('shows the message in the font demos only, and the other demos still run', async () => {
    const entries = demosWithFonts(await loadTypeface(() => Promise.reject(new Error('offline'))));
    expect(entries.map((entry) => entry.id)).toEqual(demosWithFonts(NO_TYPEFACE).map((entry) => entry.id));
    const shown = play([], entries);
    expect(rowText(shown.view, 0)).toContain('TTF Font Vector Renderer');
    expect(Array.from({ length: 30 }, (_, row) => rowText(shown.view, row)).join('\n')).toContain('Error: TTF Font file missing or failed to parse.');
    expect(shown.at).toBeGreaterThan(0);
    const other = play([keyMsg('1')], entries);
    expect(rowText(other.view, 29)).toContain(entries[0]?.description ?? 'missing');
  });
});
