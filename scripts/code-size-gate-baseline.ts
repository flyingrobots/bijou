import type { CodeSizeBaselineEntry } from './code-size-gate-types.js';

export const CODE_SIZE_BASELINE: readonly CodeSizeBaselineEntry[] =
  Object.freeze([
    { path: 'examples/docs/stories.ts', lines: 4558 },
    { path: 'examples/docs/app.ts', lines: 3306 },
    { path: 'packages/bijou-tui/src/app-frame.ts', lines: 2847 },
    { path: 'packages/bijou/src/core/components/table.ts', lines: 990 },
    { path: 'packages/bijou-tui/src/runtime-engine.ts', lines: 975 },
    { path: 'packages/bijou/src/core/render/differ.ts', lines: 901 },
    { path: 'packages/bijou/src/core/ui-scene-ir.ts', lines: 889 },
    { path: 'packages/bijou-tui/src/app-frame-overlays.ts', lines: 877 },
    { path: 'examples/docs/i18n-debt.ts', lines: 831 },
    { path: 'packages/bijou/src/ports/surface.ts', lines: 823 },
    { path: 'packages/bijou-tui/src/app-frame-render.ts', lines: 763 },
    { path: 'scripts/pr-review-status.ts', lines: 754 },
    { path: 'examples/image-viewer/main.ts', lines: 740 },
    { path: 'examples/notifications/main.ts', lines: 725 },
    { path: 'examples/_shared/canonical-app.ts', lines: 724 },
  ]);
