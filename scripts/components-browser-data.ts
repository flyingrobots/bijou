import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { parseFamilySections } from './design-system-docs-parser.js';
import { readDocumentationFile } from './documentation-corpus.js';

/**
 * The Components library reads its example snippets and design-system
 * families from files that only Node can read. These are the generated JSON
 * copies it imports instead, so that a bundler can inline them; the drift
 * test `tests/components-browser-data.test.ts` regenerates and compares them.
 */
const ROOT = new URL('../', import.meta.url);
const STORY_DIR = new URL('examples/docs/', ROOT);
const FAMILIES_DOC = new URL('docs/design-system/component-families.md', ROOT);
export const COMPONENTS_DATA_DIR = 'examples/components/generated';

/** Return the source text of each `render:` property in a story file, in declaration order. */
function renderSources(text: string): string[] {
  const out: string[] = [];
  let from = 0;
  for (;;) {
    const start = text.indexOf('render:', from);
    if (start < 0) return out;
    let depth = 0;
    let end = start + 'render:'.length;
    for (; end < text.length; end++) {
      const ch = text[end];
      if (ch === '(' || ch === '{' || ch === '[') depth++;
      else if (ch === ')' || ch === '}' || ch === ']') {
        if (depth === 0) break;
        depth--;
      } else if (ch === ',' && depth === 0) break;
    }
    out.push(text.slice(start + 'render:'.length, end).trim());
    from = end;
  }
}

/** Drop the `({ ctx }) =>` header and the common indentation, keeping the call as written. */
function tidy(source: string): string[] {
  const body = source.replace(/^\([^)]*\)\s*=>\s*/, '').replace(/^\{\s*\n?/, '').replace(/\n?\s*\}$/, '');
  const lines = body.split('\n');
  const indents = lines.slice(1).filter((l) => l.trim() !== '').map((l) => /^ */.exec(l)?.[0].length ?? 0);
  const cut = indents.length === 0 ? 0 : Math.min(...indents);
  return lines.map((l, i) => (i === 0 ? l : l.slice(cut))).filter((l) => l.trim() !== '');
}

/** story id → per-variant example code, read from the story's own TypeScript source, in directory order. */
function snippets(): { id: string; variants: string[][] }[] {
  return readdirSync(STORY_DIR).filter((f) => f.startsWith('stories-story-') && f.endsWith('.ts')).flatMap((file) => {
    const text = readFileSync(new URL(file, STORY_DIR), 'utf8');
    const id = /\bid:\s*'([^']+)'/.exec(text)?.[1];
    return id === undefined ? [] : [{ id, variants: renderSources(text).map(tidy) }];
  });
}

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

/** Each generated file, by its path from the repository root, and its exact text. */
export function componentsBrowserData(): ReadonlyMap<string, string> {
  return new Map([
    [`${COMPONENTS_DATA_DIR}/library-snippets.json`, json(snippets())],
    [`${COMPONENTS_DATA_DIR}/component-families.json`, json(parseFamilySections(readDocumentationFile(FAMILIES_DOC, 'utf8')))],
  ]);
}

/**
 * Paths under `root` whose committed copy is missing, differs from what the
 * sources give now, or is not generated at all: empty when nothing drifted.
 */
export function staleComponentsBrowserData(root: URL = ROOT): string[] {
  const expected = componentsBrowserData();
  const dir = new URL(`${COMPONENTS_DATA_DIR}/`, root);
  const present = existsSync(dir) ? readdirSync(dir).map((name) => `${COMPONENTS_DATA_DIR}/${name}`) : [];
  return [...new Set([...present, ...expected.keys()])].sort().filter((path) => {
    const text = expected.get(path);
    return text === undefined || !present.includes(path) || readFileSync(new URL(path, root), 'utf8') !== text;
  });
}
