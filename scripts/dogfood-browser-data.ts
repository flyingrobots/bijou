import { existsSync, readdirSync, readFileSync } from 'node:fs';

/**
 * DOGFOOD reads a logo and its translated guides from files that only Node
 * can read. These are the generated JSON copies it imports instead, so that a
 * bundler can inline them; `tests/dogfood-browser-data.test.ts` regenerates
 * them and fails on drift, and `npm run components:data` writes them.
 */
const ROOT = new URL('../', import.meta.url);
export const DOGFOOD_DATA_DIR = 'examples/docs/generated';
const LOGO = 'assets/flyingrobotslogo.txt';
const TRANSLATIONS = 'examples/docs/content/i18n';

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

/** `<locale>/<guide id>` → the article file's text, for every translated guide, in name order. */
function translations(root: URL): Record<string, string> {
  const base = new URL(`${TRANSLATIONS}/`, root);
  const table: Record<string, string> = {};
  for (const locale of readdirSync(base).sort()) {
    for (const file of readdirSync(new URL(`${locale}/`, base)).sort()) {
      if (file.endsWith('.md')) table[`${locale}/${file.slice(0, -'.md'.length)}`] = readFileSync(new URL(`${locale}/${file}`, base), 'utf8');
    }
  }
  return table;
}

/** Each generated file, by its path from the repository root, and its exact text. */
export function dogfoodBrowserData(root: URL = ROOT): ReadonlyMap<string, string> {
  return new Map([
    [`${DOGFOOD_DATA_DIR}/flyingrobotslogo.json`, json(readFileSync(new URL(LOGO, root), 'utf8'))],
    [`${DOGFOOD_DATA_DIR}/guide-translations.json`, json(translations(root))],
  ]);
}

/**
 * Paths under `copy` whose committed copy is missing, differs from what the
 * sources under `sources` give now, or is not generated at all.
 */
export function staleDogfoodBrowserData(copy: URL = ROOT, sources: URL = ROOT): string[] {
  const expected = dogfoodBrowserData(sources);
  const dir = new URL(`${DOGFOOD_DATA_DIR}/`, copy);
  const present = existsSync(dir) ? readdirSync(dir).map((name) => `${DOGFOOD_DATA_DIR}/${name}`) : [];
  return [...new Set([...present, ...expected.keys()])].sort().filter((path) => {
    const text = expected.get(path);
    return text === undefined || !present.includes(path) || readFileSync(new URL(path, copy), 'utf8') !== text;
  });
}
