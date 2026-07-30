import { table } from './stories-runtime.js';
import type { BijouContext, TablePipeFormat } from './stories-runtime.js';
import { tablePreviewWidth } from './stories-helper-table-preview-width.js';
import { TABLE_STORY_COLUMNS } from './stories-helper-table-story-columns.js';
import { TABLE_STORY_ROWS } from './stories-helper-table-story-rows.js';

export function tablePipeFormatPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly pipeFormat: TablePipeFormat;
}): string {
  const {
    width,
    ctx,
    title,
    pipeFormat,
  } = input;
  const previewWidth = tablePreviewWidth(width);
  const renderCtx: BijouContext = ctx.mode === 'pipe' || ctx.mode === 'accessible'
    ? ctx
    : { ...ctx, mode: 'pipe' };
  const rendered = table({
    columns: TABLE_STORY_COLUMNS,
    rows: TABLE_STORY_ROWS,
    pipeFormat,
    width: previewWidth,
    ctx: renderCtx,
  });

  return [title, '', rendered].join('\n');
}
