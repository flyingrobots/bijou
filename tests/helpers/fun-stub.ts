import { createSurface, type Surface } from '@flyingrobots/bijou';
import { defineDemo, type DemoEntry } from '../../examples/fun/contract.js';
import type { CatalogEntry } from '../../examples/fun/registry.js';
import { cellsOf } from './fun-demos.js';

/** A demo no catalog holds. It paints what it has heard: row 0 its keys, row 1 its last pointer, row 2 its pane and pulses. */
export const stubDemo: DemoEntry = defineDemo<{ readonly keys: readonly string[]; readonly pointer: string; readonly pane: string; readonly pulses: number }>({
  id: 'stub', name: 'Stub Demo', description: 'A demo only the test registers', keys: 'k does nothing',
  captures: (state) => state.keys.at(-1) === 'i',
  init: () => ({ keys: [], pointer: 'none', pane: 'unsized', pulses: 0 }),
  update(msg, state) {
    if (msg.type === 'key') return { ...state, keys: [...state.keys, msg.key] };
    if (msg.type === 'pointer') return { ...state, pointer: `${String(msg.col)},${String(msg.row)}` };
    if (msg.type === 'pointer-leave') return { ...state, pointer: 'left' };
    if (msg.type === 'resize') return { ...state, pane: `${String(msg.width)}x${String(msg.height)}` };
    return { ...state, pulses: state.pulses + 1 };
  },
  view(state, { width, height }) {
    const surface = createSurface(width, height);
    const lines = [`keys ${state.keys.join(' ')}`, `pointer ${state.pointer}`, `pane ${state.pane} pulses ${String(state.pulses)}`];
    lines.slice(0, height).forEach((line, row) => {
      for (let i = 0; i < Math.min(width, line.length); i += 1) surface.set(i, row, { char: line.charAt(i), empty: false });
    });
    return surface;
  },
});

/** The stub as a catalog entry, as a new demo would be registered. */
export const stubCatalogEntry: CatalogEntry = {
  id: stubDemo.id, name: stubDemo.name, description: stubDemo.description, load: () => Promise.resolve(stubDemo),
};

export function rowText(surface: Surface, row: number): string {
  return cellsOf(surface).slice(row * surface.width, (row + 1) * surface.width).map((cell) => cell.char).join('');
}
