import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { catalog, loadDemos, type DemoHost } from '../examples/fun/registry.js';
import { FONT_FILE } from './helpers/fun-font.js';
import { stubCatalogEntry } from './helpers/fun-stub.js';

const fontHost: DemoHost = { font: () => Promise.resolve(readFileSync(FONT_FILE)) };

describe('the fun catalog', () => {
  it('lists the ten demos in order, each with an id that reads in an address, a name and a one-line description', () => {
    expect(catalog.map((entry) => entry.id)).toEqual([
      'rainbow-gradient', 'wormhole', 'metaballs', 'fluid', 'flip-fluid', 'raymarcher', 'raycaster', 'raytracer', 'font-renderer', 'text-cylinder',
    ]);
    expect(new Set(catalog.map((entry) => entry.id)).size).toBe(catalog.length);
    for (const entry of catalog) {
      expect(entry.id).toMatch(/^[a-z][a-z0-9-]*$/u);
      expect(entry.name).not.toBe('');
      expect(entry.description).not.toBe('');
      expect(entry.description).not.toContain('\n');
    }
  });

  it('says of each demo what the loaded demo says of itself', async () => {
    const loaded = await loadDemos(fontHost);
    expect(loaded.map(({ id, name, description }) => ({ id, name, description })))
      .toEqual(catalog.map(({ id, name, description }) => ({ id, name, description })));
  });

  it('imports no demo module statically, so each loads only when its entry is asked for', () => {
    const source = readFileSync(join(import.meta.dirname, '..', 'examples', 'fun', 'registry.ts'), 'utf8');
    const statics = [...source.matchAll(/^import\s+(type\s+)?[^;]*?from\s+'([^']+)'/gmu)].filter((match) => match[1] === undefined).map((match) => match[2]);
    expect(statics).toEqual([]);
    const dynamic = [...source.matchAll(/import\('(\.\/demos\/[^']+)'\)/gu)].map((match) => match[1]);
    expect(dynamic).toHaveLength(catalog.length);
    expect(new Set(dynamic).size).toBe(catalog.length);
  });

  it('loads the entries it is given, in their order, a new one included', async () => {
    const first = catalog[0];
    if (first === undefined) throw new Error('the catalog is empty');
    const loaded = await loadDemos(fontHost, [stubCatalogEntry, first]);
    expect(loaded.map((entry) => entry.id)).toEqual(['stub', first.id]);
  });

  it('asks the host for the font once, however many demos draw it', async () => {
    let asked = 0;
    const loaded = await loadDemos({ font: () => { asked += 1; return Promise.resolve(readFileSync(FONT_FILE)); } });
    expect(loaded).toHaveLength(catalog.length);
    expect(asked).toBe(1);
  });

  it('rejects when a demo module fails to load, naming nothing else as loaded', async () => {
    const broken = { ...stubCatalogEntry, id: 'broken', load: () => Promise.reject(new Error('chunk missing')) };
    await expect(loadDemos(fontHost, [stubCatalogEntry, broken])).rejects.toThrow('chunk missing');
  });
});
