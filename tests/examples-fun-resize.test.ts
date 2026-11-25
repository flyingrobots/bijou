import { describe, expect, it } from 'vitest';
import { createSurface } from '@flyingrobots/bijou';
import type { App, KeyMsg, ResizeMsg } from '@flyingrobots/bijou-tui';
import { defineDemo } from '../examples/fun/contract.js';
import { createFunApp, type ShellModel } from '../examples/fun/shell.js';
import { SEED, funContext } from './helpers/fun-demos.js';

interface Seen {
  readonly sizes: readonly string[];
  readonly pulsesBeforeFirstSize: number;
}

/** A demo that remembers every size message and whether a pulse came before the first. */
function probe(id: string) {
  return defineDemo<Seen>({
    id, name: id, description: id, keys: 'none',
    init: () => ({ sizes: [], pulsesBeforeFirstSize: 0 }),
    update: (msg, state) => msg.type === 'resize' ? { ...state, sizes: [...state.sizes, `${String(msg.width)}x${String(msg.height)}`] }
      : msg.type === 'pulse' && state.sizes.length === 0 ? { ...state, pulsesBeforeFirstSize: state.pulsesBeforeFirstSize + 1 } : state,
    view: (state, { width, height }) => {
      const surface = createSurface(width, height);
      for (const [i, ch] of Array.from(`${state.sizes.join(',')}|${String(state.pulsesBeforeFirstSize)}`).entries()) {
        if (i < width) surface.set(i, 0, { char: ch, empty: false });
      }
      return surface;
    },
  });
}

function firstRow(app: App<ShellModel>, model: ShellModel): string {
  const view = app.view(model);
  if (!('cells' in view)) throw new Error('the shell must return a Surface');
  return Array.from({ length: view.width }, (_, x) => view.get(x, 1).char).join('').trimEnd();
}

describe('the shell sends each demo its pane size', () => {
  const app = createFunApp({ ctx: funContext(100, 30), entries: [probe('a'), probe('b')], seed: SEED });
  const resize: ResizeMsg = { type: 'resize', columns: 60, rows: 20 };
  const tab: KeyMsg = { type: 'key', key: 'tab', ctrl: false, alt: false, shift: false };

  it('before the first pulse, as the screen less the header and footer rows', () => {
    const [model] = app.init();
    expect(firstRow(app, model)).toBe('100x28|0');
  });

  it('again when the pane changes, to the demo that is showing and the one that is not', () => {
    const [model] = app.init();
    const [resized] = app.update(resize, model);
    expect(firstRow(app, resized)).toBe('100x28,60x18|0');
    const [other] = app.update(tab, resized);
    expect(firstRow(app, other)).toBe('100x28,60x18|0');
  });
});
