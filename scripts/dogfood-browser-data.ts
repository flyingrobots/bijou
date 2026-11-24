import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { documentDigests, documentTable } from './dogfood-documents.js';
import { localPathViolations } from './no-local-path-policy.js';

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

/**
 * Each text as an array of its lines. A JSON string escapes a newline as a
 * backslash, and `scripts/no-local-paths.test.ts` reads a one-letter word, a
 * colon and a backslash as a Windows path, so a text with `r:` at the end of a
 * line would fail that test as one long string. Lines carry no such escape.
 */
function asLines(texts: Readonly<Record<string, string>>): Record<string, string[]> {
  return Object.fromEntries(Object.entries(texts).map(([key, text]) => [key, text.split('\n')]));
}

/** `json(value)`, refusing text the repository's local-path policy would reject in the committed file. */
function checkedJson(path: string, value: unknown): string {
  const text = json(value);
  const found = localPathViolations(path, text);
  if (found.length > 0) throw new Error(`${path} would hold a local-path-like text: ${found.join(', ')}`);
  return text;
}

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
  const documents = documentTable();
  return new Map([
    [`${DOGFOOD_DATA_DIR}/documents.json`, checkedJson(`${DOGFOOD_DATA_DIR}/documents.json`, asLines(documents))],
    [`${DOGFOOD_DATA_DIR}/documents.sha256.json`, json(documentDigests(documents))],
    [`${DOGFOOD_DATA_DIR}/flyingrobotslogo.json`, json(readFileSync(new URL(LOGO, root), 'utf8'))],
    [`${DOGFOOD_DATA_DIR}/guide-translations.json`, checkedJson(`${DOGFOOD_DATA_DIR}/guide-translations.json`, asLines(translations(root)))],
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
