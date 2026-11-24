import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createSurface, type Surface } from '@flyingrobots/bijou';
import type { App, KeyMsg, MouseMsg } from '@flyingrobots/bijou-tui';
import { defineDemo } from '../../examples/fun/contract.js';
import { demos } from '../../examples/fun/registry.js';
import { funBuild } from '../../examples/fun/browser.js';
import { GALLERY_DEMOS } from '../../examples/web-gpu/src/gallery/demos.js';
import { cellsOf, funContext } from '../helpers/fun-demos.js';

// Wide enough for the header to list every demo by name.
const ctx = funContext(260, 30);
const key = (name: string): KeyMsg => ({ type: 'key', key: name, ctrl: false, alt: false, shift: false });
const move = (col: number, row: number): MouseMsg =>
  ({ type: 'mouse', button: 'none', action: 'move', col, row, shift: false, alt: false, ctrl: false });

/** A demo nothing in the showcase has heard of: it paints how many pointer moves it has had. */
const stub = defineDemo<{ readonly moves: number }>({
  id: 'stub', name: 'Stub Demo', description: 'A demo only the test registers', keys: 'none',
  init: () => ({ moves: 0 }),
  update: (msg, state) => (msg.type === 'pointer' ? { moves: state.moves + 1 } : state),
  view(state, { width, height }) {
    const surface = createSurface(width, height);
    const text = `moves ${String(state.moves)}`;
    for (let i = 0; i < text.length; i += 1) surface.set(i, 0, { char: text.charAt(i), empty: false });
    return surface;
  },
});

function rowText(surface: Surface, row: number): string {
  return cellsOf(surface).slice(row * surface.width, (row + 1) * surface.width).map((cell) => cell.char).join('');
}

function frameOf(app: App<unknown, unknown>, messages: readonly (KeyMsg | MouseMsg)[]): Surface {
  let [model] = app.init();
  for (const msg of messages) [model] = app.update(msg, model);
  const view = app.view(model);
  if (!('cells' in view)) throw new Error('the shell must return a Surface');
  return view;
}

describe('the gallery entry for the fun shell', () => {
  it('lists the fun shell after DOGFOOD, as one entry', () => {
    const ids = GALLERY_DEMOS.map((demo) => demo.id);
    expect(ids.filter((id) => id === 'fun')).toHaveLength(1);
    expect(ids.indexOf('fun')).toBeGreaterThan(ids.indexOf('dogfood'));
  });

  it('loads the shell on demand, and its header lists every demo of the fun registry', async () => {
    const built = await GALLERY_DEMOS.find((demo) => demo.id === 'fun')?.load();
    if (built === undefined) throw new Error('the gallery has no fun entry');
    const header = rowText(frameOf(built.build(ctx), []), 0);
    for (const entry of demos) expect(header).toContain(entry.name);
  });

  it('shows a demo registered in the fun registry, reached by key and pointer, with no change under examples/web-gpu', () => {
    const app = funBuild(1888, [...demos, stub]).build(ctx);
    expect(rowText(frameOf(app, []), 0)).toContain('Stub Demo');
    const last = key(String(demos.length + 1));
    expect(rowText(frameOf(app, [last]), 29)).toContain('A demo only the test registers');
    expect(rowText(frameOf(app, [last, move(5, 3), move(6, 3)]), 1)).toContain('moves 2');
  });

  it('names no fun demo anywhere in the showcase source', () => {
    const root = join(import.meta.dirname, '..', '..', 'examples', 'web-gpu', 'src');
    const files = readdirSync(root, { recursive: true, encoding: 'utf8' }).filter((name) => /\.tsx?$/u.test(name));
    const named = files.filter((file) => {
      const text = readFileSync(join(root, file), 'utf8');
      return /fun\/demos|metaballs|wormhole|rainbow/iu.test(text) || demos.some((entry) => text.includes(entry.id));
    });
    expect(named).toEqual([]);
  });
});
