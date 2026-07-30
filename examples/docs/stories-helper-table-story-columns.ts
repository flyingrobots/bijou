import type { TableColumn } from './stories-runtime.js';

export const TABLE_STORY_COLUMNS: readonly TableColumn[] = [
  { header: 'Component', minWidth: 8, maxWidth: 18 },
  { header: 'Behavior', minWidth: 14, maxWidth: 30, weight: 3 },
  { header: 'Owner', minWidth: 5, maxWidth: 8, align: 'center' },
];
