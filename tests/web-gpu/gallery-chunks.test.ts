import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { catalog } from '../../examples/fun/registry.js';
import { GALLERY_DEMOS } from '../../examples/web-gpu/src/gallery/demos.js';

// A production build puts each demo in its own chunk, and the gallery's entry
// chunk, with everything it imports statically, holds no demo's code.
interface Item { readonly file: string; readonly isDynamicEntry?: boolean; readonly imports?: readonly string[] }
/** Each demo's own module, as the manifest names it: a path from the showcase's root. A fun demo's is the one its catalog entry imports. */
const FUN_MODULES = new Map([...readFileSync(fileURLToPath(new URL('../../examples/fun/registry.ts', import.meta.url)), 'utf8')
  .matchAll(/id: '([^']+)'[\s\S]*?import\('\.\/demos\/([^']+)\.js'\)/gu)].map((match) => [`fun-${match[1] ?? ''}`, `../fun/demos/${match[2] ?? ''}.ts`]));
const DEMO_MODULES: Readonly<Record<string, string>> = { dogfood: '../docs/app.ts', soak: '../../bench/src/soak-browser.ts', ...Object.fromEntries(FUN_MODULES) };
const config = fileURLToPath(new URL('../../examples/web-gpu/vite.config.ts', import.meta.url));
const out = mkdtempSync(join(tmpdir(), 'bijou-gallery-chunks-'));
let manifest: Record<string, Item> = {};

/** The manifest's items, each checked for the fields this test reads. */
function toManifest(value: unknown): Record<string, Item> {
  if (typeof value !== 'object' || value === null) throw new Error('the build manifest is not an object');
  const items: Record<string, Item> = {};
  for (const [key, item] of Object.entries(value)) {
    const file: unknown = typeof item === 'object' && item !== null ? Reflect.get(item, 'file') : undefined;
    const imports: unknown = typeof item === 'object' && item !== null ? Reflect.get(item, 'imports') : undefined;
    const dynamic: unknown = typeof item === 'object' && item !== null ? Reflect.get(item, 'isDynamicEntry') : undefined;
    if (typeof file !== 'string') throw new Error(`the manifest item ${key} has no file`);
    items[key] = { file, isDynamicEntry: dynamic === true, imports: Array.isArray(imports) ? imports.filter((entry): entry is string => typeof entry === 'string') : [] };
  }
  return items;
}

beforeAll(async () => {
  await build({ configFile: config, logLevel: 'silent', build: { outDir: out, emptyOutDir: true, manifest: true } });
  manifest = toManifest(JSON.parse(readFileSync(join(out, '.vite', 'manifest.json'), 'utf8')));
}, 280_000);
afterAll(() => { rmSync(out, { recursive: true, force: true }); });

/** Every file the page loads before any demo: the entry chunk and its static imports. */
function eager(entry: string): ReadonlySet<string> {
  const seen = new Set<string>();
  const walk = (key: string): void => {
    if (seen.has(key)) return;
    seen.add(key);
    for (const next of manifest[key]?.imports ?? []) walk(next);
  };
  walk(entry);
  return new Set([...seen].map((key) => manifest[key]?.file ?? ''));
}

describe('the gallery build', () => {
  it('names a module for every registered demo', () => {
    expect(Object.keys(DEMO_MODULES)).toEqual(GALLERY_DEMOS.map((demo) => demo.id));
  });

  it('puts each demo in a chunk of its own that is loaded on demand', () => {
    const files = GALLERY_DEMOS.map((demo) => manifest[DEMO_MODULES[demo.id] ?? '']);
    for (const item of files) expect(item?.isDynamicEntry).toBe(true);
    expect(new Set(files.map((item) => item?.file)).size).toBe(GALLERY_DEMOS.length);
  });

  it('gives each fun demo a chunk no other fun demo and no shared loader imports, so opening one downloads only its own', () => {
    expect(FUN_MODULES.size).toBe(catalog.length);
    const own = new Map([...FUN_MODULES].map(([id, module]) => [id, manifest[module]?.file ?? '']));
    for (const [id, module] of FUN_MODULES) {
      const others = [...own].filter(([other]) => other !== id).map(([, file]) => file);
      const reached = eager(module);
      for (const file of others) expect(reached.has(file), `${id} reaches ${file}`).toBe(false);
    }
    const loader = eager('../fun/browser.ts');
    for (const file of own.values()) expect(loader.has(file)).toBe(false);
  });

  it('keeps every demo out of the gallery entry chunk and the chunks it imports', () => {
    const loaded = eager('gallery.html');
    expect(loaded.size).toBeGreaterThan(1);
    for (const demo of GALLERY_DEMOS) {
      const file = manifest[DEMO_MODULES[demo.id] ?? '']?.file ?? '';
      expect(file).not.toBe('');
      expect(loaded.has(file)).toBe(false);
    }
  });
});
