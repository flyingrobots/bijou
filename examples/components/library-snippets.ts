import { readdirSync, readFileSync } from 'node:fs';

const STORY_DIR = new URL('../docs/', import.meta.url);

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

/** story id → per-variant example code, read from the story's own TypeScript source. */
export const SNIPPETS: ReadonlyMap<string, readonly (readonly string[])[]> = new Map(
  readdirSync(STORY_DIR).filter((f) => f.startsWith('stories-story-') && f.endsWith('.ts')).flatMap((file) => {
    const text = readFileSync(new URL(file, STORY_DIR), 'utf8');
    const id = /\bid:\s*'([^']+)'/.exec(text)?.[1];
    return id === undefined ? [] : [[id, renderSources(text).map(tidy)] as const];
  }),
);
