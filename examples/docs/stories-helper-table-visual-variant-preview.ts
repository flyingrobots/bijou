import { table } from './stories-runtime.js';
import type { BijouContext, TableVariant } from './stories-runtime.js';
import { tablePreviewWidth } from './stories-helper-table-preview-width.js';
import { TABLE_STORY_COLUMNS } from './stories-helper-table-story-columns.js';
import { TABLE_STORY_DEFINITION_ROWS } from './stories-helper-table-story-definition-rows.js';
import { TABLE_STORY_EXPANDED_ROWS } from './stories-helper-table-story-expanded-rows.js';
import { TABLE_STORY_ROWS } from './stories-helper-table-story-rows.js';

export function tableVisualVariantPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly variant: TableVariant;
}): string {
  const {
    width,
    ctx,
    title,
    variant,
  } = input;
  const previewWidth = tablePreviewWidth(width);
  const rendered = variant === 'definition'
    ? table({
        variant,
        rows: TABLE_STORY_DEFINITION_ROWS,
        width: previewWidth,
        ctx,
      })
    : table({
        columns: TABLE_STORY_COLUMNS,
        rows: variant === 'expanded' ? TABLE_STORY_EXPANDED_ROWS : TABLE_STORY_ROWS,
        variant,
        width: previewWidth,
        ctx,
      });

  return [title, '', rendered].join('\n');
}
