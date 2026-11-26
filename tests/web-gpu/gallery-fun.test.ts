import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Surface } from '@flyingrobots/bijou';
import type { App, KeyMsg, MouseMsg } from '@flyingrobots/bijou-tui';
import { catalog } from '../../examples/fun/registry.js';
import { GALLERY_DEMOS, funGalleryDemos } from '../../examples/web-gpu/src/gallery/demos.js';
import { parseRoute } from '../../examples/web-gpu/src/gallery/route.js';
import { funContext } from '../helpers/fun-demos.js';
import { fixtureCatalog } from '../helpers/fun-fixture.js';
import { rowText, stubCatalogEntry } from '../helpers/fun-stub.js';

const ctx = funContext(100, 30);
const key = (name: string): KeyMsg => ({ type: 'key', key: name, ctrl: false, alt: false, shift: false });
const move = (col: number, row: number): MouseMsg =>
  ({ type: 'mouse', button: 'none', action: 'move', col, row, shift: false, alt: false, ctrl: false });

function frameOf(app: App<unknown, unknown>, messages: readonly (KeyMsg | MouseMsg)[]): Surface {
  let [model] = app.init();
  for (const msg of messages) [model] = app.update(msg, model);
  const view = app.view(model);
  if (!('cells' in view)) throw new Error('the demo page must paint a Surface');
  return view;
}

const fun = GALLERY_DEMOS.filter((demo) => demo.id.startsWith('fun-'));

describe('the gallery entries made from a catalog', () => {
  it('makes one card per entry, in the catalog\'s order, at fun-<id>, with the entry\'s name and description', () => {
    const { entries } = fixtureCatalog();
    expect(funGalleryDemos(entries).map(({ id, title, description }) => ({ id, title, description })))
      .toEqual(entries.map((entry) => ({ id: `fun-${entry.id}`, title: entry.name, description: entry.description })));
    expect(funGalleryDemos([])).toEqual([]);
  });

  it('opens each card on its own entry and no other', async () => {
    const { entries, log } = fixtureCatalog();
    const cards = funGalleryDemos(entries);
    for (const [index, card] of cards.entries()) {
      const before = log.loads.length;
      const built = await card.load();
      expect(log.loads.slice(before).map((load) => load.id), card.id).toEqual([entries[index]?.id]);
      expect(rowText(frameOf(built.build(ctx), []), 0), card.id).toContain(`demo ${entries[index]?.id ?? 'missing'}`);
    }
  });

  it('routes fun-<id> to that card, and an id the catalog lacks to the gallery', () => {
    const cards = funGalleryDemos(fixtureCatalog().entries);
    const route = parseRoute('?app=fun-gamma&backend=canvas2d', cards);
    expect(route.kind === 'demo' && route.demo.title).toBe('Fake gamma');
    expect(parseRoute('?app=fun-zeta', cards)).toEqual({ kind: 'gallery', unknown: 'fun-zeta' });
  });
});

describe('the gallery entries for the fun demos', () => {
  it('lists the fun catalog\'s demos, in its order, after DOGFOOD and the soak bench', () => {
    expect(GALLERY_DEMOS.map((demo) => demo.id)).toEqual(['dogfood', 'soak', ...catalog.map((entry) => `fun-${entry.id}`)]);
    expect(fun.map(({ title, description }) => ({ title, description })))
      .toEqual(catalog.map(({ name, description }) => ({ title: name, description })));
  });

  it('has no entry for the shell that once held them all, and routes its old address to no demo', () => {
    expect(GALLERY_DEMOS.some((demo) => demo.id === 'fun')).toBe(false);
    expect(parseRoute('?app=fun').kind).toBe('gallery');
  });

  it('routes fun-<id> to that demo, and an unknown fun-<id> to the gallery with the id it was asked for', () => {
    const route = parseRoute('?app=fun-wormhole&backend=canvas2d');
    expect(route.kind === 'demo' && route.demo.title).toBe('Retro Wormhole');
    expect(parseRoute('?app=fun-nope')).toEqual({ kind: 'gallery', unknown: 'fun-nope' });
  });

  it('gives a stub entry added to the catalog a card that opens it alone, with no change under examples/web-gpu', async () => {
    const cards = funGalleryDemos([...catalog, stubCatalogEntry]);
    const card = cards.at(-1);
    expect(card).toMatchObject({ id: 'fun-stub', title: 'Stub Demo', description: 'A demo only the test registers' });
    expect(parseRoute('?app=fun-stub', cards).kind).toBe('demo');
    const built = await card?.load();
    if (built === undefined) throw new Error('the stub has no card');
    const app = built.build(ctx);
    expect(rowText(frameOf(app, []), 2)).toContain('pane 100x29');
    // Its keys and the pointer reach it, the keys a shell would keep included, and nothing lists another demo.
    const played = frameOf(app, [key('tab'), key('2'), key('q'), move(5, 3), move(6, 0)]);
    expect(rowText(played, 0)).toContain('keys tab 2 q');
    expect(rowText(played, 1)).toContain('pointer 6,0');
    expect(rowText(played, 29)).toContain('A demo only the test registers');
    for (const entry of catalog) expect(Array.from({ length: 30 }, (_, row) => rowText(played, row)).join('\n')).not.toContain(entry.name);
  });

  it('loads a demo of the catalog on demand and mounts it alone, with its own key hints', async () => {
    const built = await GALLERY_DEMOS.find((demo) => demo.id === 'fun-wormhole')?.load();
    if (built === undefined) throw new Error('the gallery has no wormhole entry');
    const frame = frameOf(built.build(ctx), []);
    expect(rowText(frame, 29)).toContain('Perspective rings and vector lines');
    expect(rowText(frame, 29)).toContain('m ');
    expect(rowText(frame, 29)).not.toMatch(/switch|quits/u);
  });

  it('rejects the load when the demo module fails to load, so the page can say so', async () => {
    const broken = { ...stubCatalogEntry, id: 'broken', load: () => Promise.reject(new Error('chunk missing')) };
    await expect(funGalleryDemos([broken])[0]?.load()).rejects.toThrow('chunk missing');
  });

  it('names no fun demo anywhere in the showcase source', () => {
    const root = join(import.meta.dirname, '..', '..', 'examples', 'web-gpu', 'src');
    const files = readdirSync(root, { recursive: true, encoding: 'utf8' }).filter((name) => /\.tsx?$/u.test(name));
    const named = files.filter((file) => {
      const text = readFileSync(join(root, file), 'utf8');
      return /fun\/demos|metaballs|wormhole|rainbow/iu.test(text) || catalog.some((entry) => text.includes(entry.id));
    });
    expect(named).toEqual([]);
  });
});
