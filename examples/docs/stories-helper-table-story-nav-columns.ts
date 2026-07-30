import type { TableColumn } from './stories-runtime.js';
import { TABLE_STORY_COLUMNS } from './stories-helper-table-story-columns.js';
import { TABLE_STORY_NAV_WIDTHS } from './stories-helper-table-story-nav-widths.js';

export const TABLE_STORY_NAV_COLUMNS: readonly TableColumn[] = TABLE_STORY_COLUMNS.map((column, index) => ({
  header: column.header,
  width: TABLE_STORY_NAV_WIDTHS[index] ?? 12,
  align: column.align,
}));
