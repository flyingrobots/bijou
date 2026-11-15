import { createSurface, type Surface } from '../../packages/bijou/src/index.js';
import type { ComponentStory } from '../_stories/protocol.js';
import { designFamilyFor } from './library-design.js';

const GAP = 6;

/** A story's functions, one per name, without "()". */
const functionsOf = (story: ComponentStory): string[] =>
  story.title.split('/').map((n) => n.trim().replace(/\(\)$/, '')).filter((n) => n !== '');

/**
 * The functions a slide covers, grouped under their design-system family names (book record R19),
 * for example "Transient app notifications". A story without a family entry is headed by its own title.
 */
export function groupedFunctions(stories: readonly ComponentStory[]): { heading: string; names: string[] }[] {
  const groups = new Map<string, Set<string>>();
  for (const story of stories) {
    const heading = designFamilyFor(story)?.name ?? story.title;
    const names = groups.get(heading) ?? new Set<string>();
    for (const name of functionsOf(story)) names.add(name);
    groups.set(heading, names);
  }
  return [...groups].map(([heading, names]) => ({ heading, names: [...names] }));
}

/**
 * A family slide's functions: one column per design family, a bold heading, then one name per line.
 * Columns wrap to a new row when they do not fit; in RTL their order and alignment mirror.
 */
export function namesSurface(stories: readonly ComponentStory[], maxWidth: number, rtl: boolean): Surface {
  const columns = groupedFunctions(stories)
    .map((c) => ({ ...c, width: Math.max(c.heading.length, ...c.names.map((n) => n.length)) }));
  const rows: (typeof columns)[] = [];
  for (const column of columns) {
    const row = rows.at(-1);
    const used = row === undefined ? Infinity : row.reduce((w, c) => w + c.width + GAP, 0);
    if (row === undefined || used + column.width > maxWidth) rows.push([column]);
    else row.push(column);
  }
  const width = Math.min(maxWidth, Math.max(...rows.map((r) => r.reduce((w, c) => w + c.width, 0) + GAP * (r.length - 1))));
  const heights = rows.map((r) => 1 + Math.max(...r.map((c) => c.names.length)));
  const surface = createSurface(width, heights.reduce((h, n) => h + n, 0) + rows.length - 1);
  const put = (x: number, y: number, text: string, bold: boolean): void => {
    Array.from(text).forEach((char, i) => { if (x + i >= 0 && x + i < width) surface.set(x + i, y, { char, modifiers: bold ? ['bold'] : [], empty: false }); });
  };
  let y = 0;
  rows.forEach((row, r) => {
    let x = 0;
    for (const column of row) {
      const left = rtl ? width - x - column.width : x;
      const align = (text: string): number => (rtl ? left + column.width - text.length : left);
      put(align(column.heading), y, column.heading, true);
      column.names.forEach((name, i) => { put(align(name), y + 1 + i, name, false); });
      x += column.width + GAP;
    }
    y += (heights[r] ?? 0) + 1;
  });
  return surface;
}
