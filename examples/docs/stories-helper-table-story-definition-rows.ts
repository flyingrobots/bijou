import { TABLE_STORY_ROWS } from './stories-helper-table-story-rows.js';

export const TABLE_STORY_DEFINITION_ROWS: readonly (readonly string[])[] = TABLE_STORY_ROWS.map(row => [
  row[0] ?? '',
  row[1] ?? '',
]);
