import { TABLE_STORY_NAV_BEHAVIORS } from './stories-helper-table-story-nav-behaviors.js';
import { TABLE_STORY_ROWS } from './stories-helper-table-story-rows.js';

export const TABLE_STORY_NAV_ROWS: readonly (readonly string[])[] = TABLE_STORY_ROWS.map((row, index) => [
  row[0] ?? '',
  TABLE_STORY_NAV_BEHAVIORS[index] ?? row[1] ?? '',
  row[2] ?? '',
]);
