import { describe, expect, it } from 'vitest';
import { createSurface, type Surface } from '@flyingrobots/bijou';
import type { PulseMsg } from '@flyingrobots/bijou-tui';
import { defineDemo } from '../examples/fun/contract.js';
import { createFunApp } from '../examples/fun/shell.js';
import { demos } from '../examples/fun/registry.js';
import { SEED, cellsOf, funContext } from './helpers/fun-demos.js';

const ctx = funContext(100, 30);
const broken = defineDemo<null>({
  id: 'broken', name: 'Broken Demo', description: 'Throws in view', keys: 'none',
  init: () => null,
  update: (_msg, state) => state,
  view: () => { throw new Error('view blew up'); },
});
const app = createFunApp({ ctx, entries: [broken, ...demos], seed: SEED });
const pulse: PulseMsg = { type: 'pulse', dt: 1 / 30 };

function rowText(surface: Surface, row: number): string {
  return cellsOf(surface).slice(row * surface.width, (row + 1) * surface.width).map((cell) => cell.char).join('');
}

function viewOf(keys: readonly string[]): Surface {
  let [model] = app.init();
  for (const key of keys) [model] = app.update({ type: 'key', key, ctrl: false, alt: false, shift: false }, model);
  [model] = app.update(pulse, model);
  const view = app.view(model);
  if (!('cells' in view)) throw new Error('the shell must return a Surface');
  return view;
}

describe('the bijou-fun shell with a demo that throws in view', () => {
  it('paints the failure in the pane and keeps the header and footer', () => {
    const view = viewOf([]);
    expect(rowText(view, 0)).toContain('Broken Demo');
    expect(rowText(view, 1)).toContain('Broken Demo failed: view blew up');
    expect(rowText(view, 29)).toContain('Throws in view');
  });

  it('lets the reader switch to a demo that works', () => {
    const view = viewOf(['tab']);
    expect(rowText(view, 1)).not.toContain('failed');
    expect(rowText(view, 29)).toContain(demos[0]?.description ?? 'missing');
  });
});
