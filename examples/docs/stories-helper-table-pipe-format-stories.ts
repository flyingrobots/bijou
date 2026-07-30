import type { TablePipeFormatSpec } from './stories-helper-table-pipe-format-spec.js';

export const TABLE_PIPE_FORMAT_STORIES: readonly TablePipeFormatSpec[] = [
  {
    id: 'pipe-tsv',
    pipeFormat: 'tsv',
  },
  {
    id: 'pipe-csv',
    pipeFormat: 'csv',
  },
  {
    id: 'pipe-markdown',
    pipeFormat: 'markdown',
  },
  {
    id: 'pipe-ascii-grid',
    pipeFormat: 'ascii-grid',
  },
];
