import { boxSurface, createNavigableTableState, navigableTableSurface, table } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';
import { TABLE_STORY_NAV_COLUMNS } from './stories-helper-table-story-nav-columns.js';
import { TABLE_STORY_NAV_ROWS } from './stories-helper-table-story-nav-rows.js';

export function denseComparisonPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
}): string | Surface {
  const {
    width,
    ctx,
    title,
  } = input;

  const state = createNavigableTableState({
    columns: [...TABLE_STORY_NAV_COLUMNS],
    rows: TABLE_STORY_NAV_ROWS,
    height: 3,
  });
  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      table({
        columns: TABLE_STORY_NAV_COLUMNS,
        rows: TABLE_STORY_NAV_ROWS.slice(0, 3),
        ctx,
      }),
    ].join('\n');
  }

  return boxSurface(navigableTableSurface(state, { ctx }), {
    title,
    width: Math.max(46, Math.min(width, 64)),
    ctx,
  });
}
