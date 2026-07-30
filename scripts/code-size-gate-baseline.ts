import type { CodeSizeBaselineEntry } from './code-size-gate-types.js';

export const CODE_SIZE_BASELINE: readonly CodeSizeBaselineEntry[] =
  Object.freeze([
    { path: 'examples/docs/stories.ts', lines: 4558 },
    { path: 'examples/docs/app.ts', lines: 3306 },
    { path: 'packages/bijou-tui/src/app-frame.ts', lines: 2847 },
    { path: 'packages/bijou/src/core/components/table.ts', lines: 990 },
    { path: 'packages/bijou-tui/src/runtime-engine.ts', lines: 975 },
  ]);
