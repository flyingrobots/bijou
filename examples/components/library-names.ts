import { createSurface, type Surface } from '../../packages/bijou/src/index.js';
import type { ComponentStory } from '../_stories/protocol.js';

const GROUPS = ['Components', 'Surface renderers', 'Setup and state'] as const;
const GAP = 6;

/** Sort a function name into a group by Bijou's naming conventions. */
function groupOf(name: string): (typeof GROUPS)[number] {
  if (/^(create|push|load)[A-Z]/.test(name)) return 'Setup and state';
  if (/^render[A-Z]/.test(name) || name.endsWith('Surface')) return 'Surface renderers';
  return 'Components';
}

/** Every function a family's stories cover, one per name, without "()" and without duplicates. */
export function familyFunctions(stories: readonly ComponentStory[]): string[] {
  const names = stories.flatMap((s) => s.title.split('/').map((n) => n.trim().replace(/\(\)$/, '')));
  return [...new Set(names)].filter((n) => n !== '');
}

/**
 * A family's functions grouped by kind: one column per group, a bold heading, then one name per line.
 * Columns wrap to a new row when they do not fit; in RTL their order and alignment mirror.
 */
export function namesSurface(stories: readonly ComponentStory[], maxWidth: number, rtl: boolean): Surface {
  const names = familyFunctions(stories);
  const columns = GROUPS
    .map((heading) => ({ heading, names: names.filter((n) => groupOf(n) === heading) }))
    .filter((c) => c.names.length > 0)
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
