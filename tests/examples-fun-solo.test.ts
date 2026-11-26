import { describe, expect, it } from 'vitest';
import type { Surface } from '@flyingrobots/bijou';
import type { KeyMsg, MouseMsg, PulseMsg, ResizeMsg } from '@flyingrobots/bijou-tui';
import { defineDemo } from '../examples/fun/contract.js';
import { createSoloApp } from '../examples/fun/solo.js';
import { SEED, demos, funContext } from './helpers/fun-demos.js';
import { rowText, stubDemo } from './helpers/fun-stub.js';

type Msg = KeyMsg | MouseMsg | PulseMsg | ResizeMsg;
const key = (name: string, extra: Partial<KeyMsg> = {}): KeyMsg => ({ type: 'key', key: name, ctrl: false, alt: false, shift: false, ...extra });
const mouse = (col: number, row: number, action: MouseMsg['action'] = 'move'): MouseMsg =>
  ({ type: 'mouse', button: 'none', action, col, row, shift: false, alt: false, ctrl: false });
const pulse: PulseMsg = { type: 'pulse', dt: 1 / 30 };

function play(messages: readonly Msg[], entry = stubDemo, columns = 100, rows = 30): { view: Surface; commands: unknown[] } {
  const app = createSoloApp({ ctx: funContext(columns, rows), entry, seed: SEED });
  let [model] = app.init();
  const commands: unknown[] = [];
  for (const msg of messages) {
    const [next, cmds] = app.update(msg, model);
    model = next;
    commands.push(...cmds);
  }
  const view = app.view(model);
  if (!('cells' in view)) throw new Error('the solo app must return a Surface');
  return { view, commands };
}

describe('one demo alone on a page', () => {
  it('gives the demo every row but the last, and names the demo and its keys there', () => {
    const { view } = play([]);
    expect([view.width, view.height]).toEqual([100, 30]);
    expect(rowText(view, 2)).toContain('pane 100x29');
    expect(rowText(view, 29)).toContain('A demo only the test registers');
    expect(rowText(view, 29)).toContain('k does nothing');
  });

  it('shows no list of demos and no key that switches or quits', () => {
    const { view } = play([]);
    const all = Array.from({ length: 30 }, (_, row) => rowText(view, row)).join('\n');
    expect(rowText(view, 0)).toContain('keys');
    expect(all).not.toContain('Stub Demo');
    expect(all).not.toMatch(/switch|quits|▸/u);
  });

  it('sends tab, the arrows, the digits and q to the demo, and asks the runtime for nothing', () => {
    const { view, commands } = play(['tab', 'left', 'right', '1', '2', 'q', 'k'].map((name) => key(name)));
    expect(rowText(view, 0)).toContain('keys tab left right 1 2 q k');
    expect(commands).toEqual([]);
  });

  it('does nothing on ctrl+c: the page is how a person leaves', () => {
    const { view, commands } = play([key('k'), key('c', { ctrl: true })]);
    expect(rowText(view, 0).trimEnd()).toBe('keys k');
    expect(commands).toEqual([]);
  });

  it('gives the pointer to the demo in its own cells, from the first row, and lets go on the footer row', () => {
    expect(rowText(play([mouse(7, 0)]).view, 1)).toContain('pointer 7,0');
    expect(rowText(play([mouse(99, 28, 'press')]).view, 1)).toContain('pointer 99,28');
    expect(rowText(play([mouse(7, 3), mouse(7, 29)]).view, 1)).toContain('pointer left');
    expect(rowText(play([mouse(7, 3), mouse(100, 3)]).view, 1)).toContain('pointer left');
    expect(rowText(play([mouse(7, 3), mouse(9, 9, 'scroll-up')]).view, 1)).toContain('pointer 7,3');
  });

  it('tells the demo its pane again when the screen changes', () => {
    const { view } = play([{ type: 'resize', columns: 60, rows: 12 }]);
    expect([view.width, view.height]).toEqual([60, 12]);
    expect(rowText(view, 2)).toContain('pane 60x11');
    expect(rowText(play([{ type: 'resize', columns: 20, rows: 1 }]).view, 0)).not.toBe('');
  });

  it('advances on pulses, and space pauses and says so', () => {
    expect(rowText(play([pulse, pulse, pulse]).view, 2)).toContain('pulses 3');
    const paused = play([pulse, key('space'), pulse, pulse]).view;
    expect(rowText(paused, 2)).toContain('pulses 1');
    expect(rowText(paused, 29)).toContain('PAUSED');
    expect(rowText(play([pulse, key('space'), key('space'), pulse]).view, 2)).toContain('pulses 2');
  });

  it('sends a demo that is taking text every key, a shifted letter with its shift and space as a key', () => {
    const { view } = play([key('i'), key('b', { shift: true }), key('i'), key('space'), pulse]);
    expect(rowText(view, 0)).toContain('keys i shift+b i space');
    expect(rowText(view, 2)).toContain('pulses 1');
    expect(rowText(view, 29)).not.toContain('PAUSED');
  });

  it('paints a demo that throws in view as a failure in the pane, and keeps the footer', () => {
    const broken = defineDemo<null>({
      id: 'broken', name: 'Broken Demo', description: 'Throws in view', keys: 'none',
      init: () => null, update: (_msg, state) => state, view: () => { throw new Error('view blew up'); },
    });
    const { view } = play([pulse], broken);
    expect(rowText(view, 0)).toContain('Broken Demo failed: view blew up');
    expect(rowText(view, 29)).toContain('Throws in view');
  });

  for (const entry of demos) {
    it(`${entry.id} alone paints what its session paints in a pane one row shorter than the screen`, () => {
      const ctx = funContext(80, 24);
      const solo = play([pulse, pulse], entry, 80, 24).view;
      const session = entry.mount(SEED).update({ type: 'resize', width: 80, height: 23 }).update(pulse).update(pulse);
      const body = session.view(80, 23, ctx);
      const rows = (surface: Surface): string[] => Array.from({ length: 23 }, (_, row) => rowText(surface, row));
      expect(rows(solo)).toEqual(rows(body));
      expect(rowText(solo, 23)).toContain(entry.description.slice(0, 40));
    });
  }
});
