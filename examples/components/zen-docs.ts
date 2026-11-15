import { readdirSync, readFileSync } from 'node:fs';
import { createSurface, wrapToWidth, type BijouContext, type Surface } from '../../packages/bijou/src/index.js';
import type { ComponentStory } from '../_stories/protocol.js';

const STORY_DIR = new URL('../docs/', import.meta.url);
const MAX_CODE_LINES = 8;

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
const SNIPPETS: ReadonlyMap<string, readonly (readonly string[])[]> = new Map(
  readdirSync(STORY_DIR).filter((f) => f.startsWith('stories-story-') && f.endsWith('.ts')).flatMap((file) => {
    const text = readFileSync(new URL(file, STORY_DIR), 'utf8');
    const id = /\bid:\s*'([^']+)'/.exec(text)?.[1];
    return id === undefined ? [] : [[id, renderSources(text).map(tidy)] as const];
  }),
);

function put(surface: Surface, y: number, text: string, cell: { fg?: string; bg?: string; modifiers?: string[] }, x = 0): void {
  Array.from(text).forEach((char, i) => { if (x + i < surface.width) surface.set(x + i, y, { char, ...cell, empty: false }); });
}

/** A brief description plus a code block with the variant's real render() call. */
export function docsSurface(story: ComponentStory, variantIndex: number, width: number, ctx: BijouContext): Surface {
  const summary = wrapToWidth(story.docs.summary, width);
  const all = SNIPPETS.get(story.id)?.[variantIndex] ?? [];
  const code = all.length > MAX_CODE_LINES ? [...all.slice(0, MAX_CODE_LINES - 1), '…'] : all;
  const codeLines = code.flatMap((line) => wrapToWidth(line, width - 4));
  const height = summary.length + (codeLines.length > 0 ? codeLines.length + 4 : 0);
  const surface = createSurface(width, height);
  summary.forEach((line, y) => { put(surface, y, line, {}); });
  if (codeLines.length === 0) return surface;

  const bg = ctx.surface('elevated').bg ?? ctx.surface('elevated').hex;
  const top = summary.length + 1;
  put(surface, top, `// ${story.title} · from the story's render()`, { fg: ctx.semantic('muted').hex });
  for (let y = top + 1; y < height; y++) put(surface, y, ' '.repeat(width), { bg });
  codeLines.forEach((line, i) => { put(surface, top + 2 + i, line, { bg }, 2); });
  return surface;
}
