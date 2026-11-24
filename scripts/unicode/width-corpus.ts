import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** A named list of strings measured by the width report. */
export interface CorpusSource {
  readonly source: string;
  readonly strings: readonly string[];
}

/**
 * Test files whose string literals are measured: grapheme, text and layout
 * tests. grapheme-uax11.test.ts is this change's own regression test, so it
 * is left out: the report counts inputs that existed before it.
 */
const OWN_TESTS = new Set(['grapheme-uax11.test.ts']);
const TEST_FILES: readonly (readonly [string, RegExp])[] = [
  ['packages/bijou/src/core/text', /\.test\.ts$/u],
  ['packages/bijou/src/core/layout', /\.test\.ts$/u],
  ['packages/bijou-tui/src', /^(layout|surface-layout)[^/]*\.test\.ts$/u],
];

function walk(root: string, directory: string, accept: (name: string) => boolean): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(resolve(root, directory), { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) out.push(...walk(root, path, accept));
    else if (accept(entry.name)) out.push(path);
  }
  return out.sort();
}

const ESCAPES: Readonly<Record<string, string>> = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };

/** Decode the body of a JavaScript string literal (no template substitutions). */
export function decodeLiteral(body: string): string {
  return body.replace(
    /\\(u\{([0-9a-fA-F]+)\}|u([0-9a-fA-F]{4})|x([0-9a-fA-F]{2})|[\s\S])/gu,
    (whole, escape: string, braced?: string, four?: string, two?: string) => {
      const digits = braced ?? four ?? two;
      if (digits !== undefined) return String.fromCodePoint(parseInt(digits, 16));
      return ESCAPES[escape] ?? (whole.length > 1 ? escape : whole);
    },
  );
}

/** Every string literal in TypeScript source, excluding template literals with `${`. */
export function stringLiterals(source: string): string[] {
  const out: string[] = [];
  const literal = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\$]|\\.|\$(?!\{))*)`/gu;
  for (const match of source.matchAll(literal)) {
    const body = match[1] ?? match[2] ?? match[3];
    if (body !== undefined) out.push(decodeLiteral(body));
  }
  for (const match of source.matchAll(/fromCodePoint\(\s*(0x[0-9a-fA-F]+)\s*\)/gu)) {
    if (match[1] !== undefined) out.push(String.fromCodePoint(Number(match[1])));
  }
  return out;
}

function jsonStrings(value: unknown, out: string[]): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const item of value) jsonStrings(item, out);
  else if (typeof value === 'object' && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      out.push(key);
      jsonStrings(item, out);
    }
  }
  return out;
}

const readText = (root: string, path: string): string => readFileSync(resolve(root, path), 'utf8');

/** The repository corpora: test literals, DOGFOOD catalogs and content, the book corpus. */
export function readRepositoryCorpus(root: string): readonly CorpusSource[] {
  const testFiles = TEST_FILES.flatMap(([directory, pattern]) =>
    walk(root, directory, (name) => pattern.test(name) && !OWN_TESTS.has(name)));
  const catalogs = walk(root, 'examples/docs/i18n/catalogs', (name) => name.endsWith('.json'));
  const content = walk(root, 'examples/docs/content', (name) => name.endsWith('.md'));
  const json = (path: string): string[] => jsonStrings(JSON.parse(readText(root, path)), []);
  return [
    { source: 'test-literal', strings: testFiles.flatMap((path) => stringLiterals(readText(root, path))) },
    {
      source: 'dogfood',
      strings: [...catalogs.flatMap(json), ...content.map((path) => readText(root, path))],
    },
    { source: 'book', strings: json('docs/book/source-corpus.json') },
  ];
}
