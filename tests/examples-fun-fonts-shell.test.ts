import { describe, expect, it } from 'vitest';
import type { Surface } from '@flyingrobots/bijou';
import type { KeyMsg } from '@flyingrobots/bijou-tui';
import type { DemoEntry } from '../examples/fun/contract.js';
import { createFunApp } from '../examples/fun/shell.js';
import { catalog, loadDemos } from '../examples/fun/registry.js';
import { FONT_IDS, SEED, cellsOf, funContext } from './helpers/fun-demos.js';
import { face, fontDemos } from './helpers/fun-font.js';
import { recordingDemo } from './helpers/fun-stub.js';

// The shell is given a fake and the two font demos: where the real catalog puts them cannot change these tests.
const other = recordingDemo('other', 'Other Demo', 'A fake that needs no font');
const withFonts = (fonts: readonly DemoEntry[]): DemoEntry[] => [other, ...fonts];
const ctx = funContext(120, 30);
const keyMsg = (name: string, extra: Partial<KeyMsg> = {}): KeyMsg => ({ type: 'key', key: name, ctrl: false, alt: false, shift: false, ...extra });

function rowText(surface: Surface, row: number): string {
  return cellsOf(surface).slice(row * surface.width, (row + 1) * surface.width).map((cell) => cell.char).join('');
}

const FIRST = 'font-renderer';

/** Open the shell on the font renderer, then send `keys`: the view, the model and every command the shell gave. */
function play(keys: readonly KeyMsg[], entries = withFonts(fontDemos(face))) {
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
    const loaded = await loadDemos({ font: () => Promise.reject(new Error('offline')) });
    expect(loaded.map((entry) => entry.id)).toEqual(catalog.map((entry) => entry.id));
    const entries = withFonts(loaded.filter((entry) => FONT_IDS.some((id) => id === entry.id)));
    expect(entries).toHaveLength(1 + FONT_IDS.length);
    const shown = play([], entries);
    expect(rowText(shown.view, 0)).toContain('TTF Font Vector Renderer');
    expect(Array.from({ length: 30 }, (_, row) => rowText(shown.view, row)).join('\n')).toContain('Error: TTF Font file missing or failed to parse.');
    expect(shown.at).toBeGreaterThan(0);
    const first = play([keyMsg('1')], entries);
    expect(rowText(first.view, 29)).toContain('A fake that needs no font');
  });
});
