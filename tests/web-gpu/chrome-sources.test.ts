import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The showcase chrome is shadcn components and layout only: these cases scan
// its sources for hand-authored markup, inline styles, raw colours and CSS
// custom properties that are not shadcn tokens. The two Bijou mount points,
// whose contents are the library's output, are the only bare elements.
const example = new URL('../../examples/web-gpu/', import.meta.url);
const read = (path: string): string => readFileSync(new URL(path, example), 'utf8');

/** Chrome sources: every .tsx under src/ except what the shadcn CLI installed (src/vendor/, src/components/). */
function chromeFiles(directory = 'src/'): readonly string[] {
  return readdirSync(new URL(directory, example), { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}${entry.name}`;
    if (entry.isDirectory()) return path === 'src/vendor' || path === 'src/components' ? [] : chromeFiles(`${path}/`);
    return path.endsWith('.tsx') ? [path] : [];
  });
}

// Layout utilities: flex and grid placement, gaps, sizes, spacing, and the page heading's type scale.
const LAYOUT = /^(?:(?:sm|md|lg|xl|2xl):)?(?:flex|grid|contents|relative|grow|shrink-0|truncate|flex-(?:col|row|wrap|1)|items-(?:start|center|end|stretch|baseline)|justify-(?:start|center|end|between)|self-(?:start|center|end|stretch)|grid-cols-\d+|col-span-(?:\d+|full)|gap(?:-[xy])?-\d+|(?:min-|max-)?[wh]-(?:\d+|full|svh|dvh|screen|auto|fit)|max-w-none|size-\d+|p[xytblr]?-\d+|m[xytblr]?-(?:\d+|auto)|ms-auto|me-auto|text-(?:\dxl|xl|lg|base)|font-(?:semibold|medium|mono|heading)|tracking-tight)$/u;

/** Every opening tag of an intrinsic element, `<div ...>`, with its attribute text; a generic such as `Array<string>` follows a name, so it is skipped. */
function intrinsicTags(source: string): readonly { tag: string; attributes: string }[] {
  return [...source.matchAll(/(?<![\w$.)\]])<([a-z][a-z0-9]*)\b([^<>]*?)\/?>/gu)].map((match) => ({ tag: match[1] ?? '', attributes: match[2] ?? '' }));
}

function problems(path: string): string[] {
  const source = read(path);
  const found: string[] = [];
  for (const { tag, attributes } of intrinsicTags(source)) {
    if (tag === 'div' && /\bdata-bijou-mount\b/u.test(attributes)) continue;
    if (tag === 'a' && /^\s*href=\{[^}]+\}\s*$/u.test(attributes)) continue;
    if (tag !== 'div' && tag !== 'h1') { found.push(`<${tag}>`); continue; }
    const rest = attributes.replace(/className="([^"]*)"/u, '').trim();
    if (rest !== '') found.push(`<${tag} ${rest}>`);
    const classes = /className="([^"]*)"/u.exec(attributes)?.[1]?.split(/\s+/u).filter(Boolean) ?? [];
    for (const name of classes) if (!LAYOUT.test(name)) found.push(`<${tag}> class ${name}`);
  }
  if (/\bstyle=\{/u.test(source)) found.push('an inline style prop');
  if (/#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl|oklch)\(/u.test(source)) found.push('a raw colour');
  if (/\b[a-z-]+-\[[^\]]*\]/u.test(source)) found.push('an arbitrary Tailwind value');
  const palette = /\b(?:bg|text|border|ring|fill|stroke|outline|shadow|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)\b/u.exec(source);
  if (palette !== null) found.push(`a palette colour ${palette[0]}`);
  if (/from ['"](?:radix-ui|cmdk|@radix-ui\/[^'"]+)['"]/u.test(source)) found.push('a primitive imported past the shadcn components');
  return found;
}

describe('examples/web-gpu chrome sources', () => {
  it('has chrome sources to scan', () => {
    expect(chromeFiles().length).toBeGreaterThan(0);
  });

  it.each(chromeFiles().map((path) => [path] as const))('%s has no hand-authored markup, inline style or raw colour', (path) => {
    expect(problems(path)).toEqual([]);
  });

  it('declares the Bijou mount host in one component, with no children of its own', () => {
    const declaring = chromeFiles().filter((path) => read(path).includes('data-bijou-mount'));
    expect(declaring).toHaveLength(1);
    expect(read(declaring[0] ?? '')).toMatch(/<div\b[^<>]*\bdata-bijou-mount\b[^<>]*\/>/u);
  });

  it('keeps each HTML entry to a root element and its module script', () => {
    for (const entry of ['index.html', 'dom.html']) {
      const body = /<body>([\s\S]*)<\/body>/u.exec(read(entry))?.[1]?.trim();
      expect(body, entry).toMatch(/^<div id="root"><\/div>\s*<script type="module" src="\.\/src\/[a-z/]+\.tsx"><\/script>$/u);
      expect(read(entry), entry).not.toMatch(/<style|rel="stylesheet"/u);
    }
  });
});
