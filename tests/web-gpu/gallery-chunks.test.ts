import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { catalog } from '../../examples/fun/registry.js';
import { GALLERY_DEMOS } from '../../examples/web-gpu/src/gallery/demos.js';

// A production build puts each demo's code in a chunk of its own, which nothing loads until that demo is opened.
// The manifest names an entry file for each demo's module, but the bundler may leave only a stub there and put the
// code in a shared chunk; so a demo's code is found by the chunk that holds its module, never by the manifest's file.
interface Item { readonly file: string; readonly isDynamicEntry: boolean }
interface Chunk { readonly fileName: string; readonly moduleIds: readonly string[]; readonly imports: readonly string[] }
const ROOT = fileURLToPath(new URL('../../examples/web-gpu/', import.meta.url));
/** Each demo's own module, as the manifest names it: a path from the showcase's root. A fun demo's is the one its catalog entry imports. */
const FUN_MODULES = new Map([...readFileSync(resolve(ROOT, '../fun/registry.ts'), 'utf8')
  .matchAll(/id: '([^']+)'[\s\S]*?import\('\.\/demos\/([^']+)\.js'\)/gu)].map((match) => [`fun-${match[1] ?? ''}`, `../fun/demos/${match[2] ?? ''}.ts`]));
const DEMO_MODULES = new Map([['dogfood', '../docs/app.ts'], ['soak', '../../bench/src/soak-browser.ts'], ...FUN_MODULES]);
const LOADER = '../fun/browser.ts';
const out = mkdtempSync(join(tmpdir(), 'bijou-gallery-chunks-'));
let manifest: Record<string, Item> = {};
let chunks: readonly Chunk[] = [];

const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []);
const field = (value: unknown, name: string): unknown => (typeof value === 'object' && value !== null ? Reflect.get(value, name) : undefined);

/** The build's chunks, each checked for the fields this test reads. */
function toChunks(result: unknown): Chunk[] {
  return (Array.isArray(result) ? result : [result]).flatMap((one) => {
    const output = field(one, 'output');
    const items: unknown[] = Array.isArray(output) ? output : [];
    return items;
  }).flatMap((item): Chunk[] => {
    const fileName = field(item, 'fileName');
    return field(item, 'type') === 'chunk' && typeof fileName === 'string'
      ? [{ fileName, moduleIds: strings(field(item, 'moduleIds')), imports: strings(field(item, 'imports')) }] : [];
  });
}

function toManifest(value: unknown): Record<string, Item> {
  if (typeof value !== 'object' || value === null) throw new Error('the build manifest is not an object');
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    const file = field(item, 'file');
    if (typeof file !== 'string') throw new Error(`the manifest item ${key} has no file`);
    return [key, { file, isDynamicEntry: field(item, 'isDynamicEntry') === true }];
  }));
}

beforeAll(async () => {
  const result: unknown = await build({ configFile: resolve(ROOT, 'vite.config.ts'), logLevel: 'silent', build: { outDir: out, emptyOutDir: true, manifest: true } });
  chunks = toChunks(result);
  manifest = toManifest(JSON.parse(readFileSync(join(out, '.vite', 'manifest.json'), 'utf8')));
}, 280_000);
afterAll(() => { rmSync(out, { recursive: true, force: true }); });

/** The chunk that holds a module's code. A module in no chunk, or in several, has no single home to check. */
function codeChunk(module: string): string {
  const path = resolve(ROOT, module);
  const holders = chunks.filter((chunk) => chunk.moduleIds.some((id) => id.split('?')[0] === path));
  if (holders.length !== 1) throw new Error(`${module} is in ${String(holders.length)} chunks, not one`);
  return holders[0]?.fileName ?? '';
}

/** Every file a page has loaded once it loads `file`: that chunk and all it imports statically. */
function loadedWith(file: string): ReadonlySet<string> {
  const seen = new Set<string>();
  const walk = (name: string): void => {
    if (seen.has(name)) return;
    seen.add(name);
    for (const next of chunks.find((chunk) => chunk.fileName === name)?.imports ?? []) walk(next);
  };
  walk(file);
  return seen;
}

/** The demos whose code a page has once it loads the entry file of `module`, other than `self`. */
function reaches(module: string, self?: string): string[] {
  const loaded = loadedWith(manifest[module]?.file ?? '');
  return [...DEMO_MODULES].filter(([id]) => id !== self).filter(([, other]) => loaded.has(codeChunk(other))).map(([id]) => id);
}

describe('the gallery build', () => {
  it('names a module for every registered demo', () => {
    expect([...DEMO_MODULES.keys()]).toEqual(GALLERY_DEMOS.map((demo) => demo.id));
    expect(FUN_MODULES.size).toBe(catalog.length);
  });

  it('makes each demo an entry loaded on demand, with its code in a chunk no other demo shares', () => {
    for (const [id, module] of DEMO_MODULES) expect(manifest[module]?.isDynamicEntry, id).toBe(true);
    const homes = [...DEMO_MODULES.values()].map(codeChunk);
    expect(new Set(homes).size).toBe(DEMO_MODULES.size);
    // Opening a demo does load that demo: its entry file brings its own code.
    for (const [id, module] of DEMO_MODULES) expect(loadedWith(manifest[module]?.file ?? '').has(codeChunk(module)), id).toBe(true);
  });

  it('loads no other demo\'s code when a demo is opened, nor when the shared loader of the fun demos is', () => {
    for (const [id, module] of DEMO_MODULES) expect(reaches(module, id), `${id} also loads`).toEqual([]);
    expect(reaches(LOADER), 'the loader loads').toEqual([]);
  });

  it('keeps every demo\'s code out of what the gallery page loads before a demo is opened', () => {
    expect(loadedWith(manifest['gallery.html']?.file ?? '').size).toBeGreaterThan(1);
    expect(reaches('gallery.html')).toEqual([]);
  });
});
