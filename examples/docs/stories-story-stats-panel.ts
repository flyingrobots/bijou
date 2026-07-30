import { CANONICAL_STORY_PROFILE_PRESETS } from './stories-runtime.js';
import { renderStatsPanelStoryPreview } from './stories-helper-render-stats-panel-story-preview.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_STATS_PANEL: DogfoodComponentStory = {
    kind: 'component',
    id: 'stats-panel',
    coverageFamilyIds: ['data-visualization'],
    family: 'Data visualization',
    title: 'statsPanelSurface()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Titled bordered panel with aligned key-value metric rows and optional inline sparklines — the go-to component for labeled metric groups.',
      useWhen: [
        'Multiple named metrics belong together in one titled region.',
        'Key-value alignment improves scannability over free-form text.',
        'Inline sparklines beside values would give trend context without a separate chart.',
      ],
      avoidWhen: [
        'A single metric does not warrant a bordered panel — use a label and value inline.',
        'The metrics need interactive drill-down or filtering — use navigableTableSurface().',
        'The data is tabular with many columns — use table().',
      ],
      relatedFamilies: ['sparkline()', 'perfOverlaySurface()', 'table()', 'box()'],
      gracefulLowering: {
        interactive: 'Bordered box with aligned labels, values, and sparklines.',
        static: 'Same bordered layout, single-frame snapshot.',
        pipe: 'Key: value lines, one per row, with trend notes when sparklines are present.',
        accessible: 'Labeled metric list read sequentially, with trend notes made explicit.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'basic',
        label: 'Basic metrics',
        description: 'Labeled key-value rows in a titled box.',
        render: ({ width, ctx }) => renderStatsPanelStoryPreview([
          { label: 'FPS', value: '60' },
          { label: 'frame time', value: '16.7 ms' },
          { label: 'heap', value: '42.1 MB' },
          { label: 'rss', value: '128 MB' },
        ], { title: 'Runtime', width: Math.min(36, Math.max(24, width - 4)) }, ctx, width),
      },
      {
        id: 'with-sparklines',
        label: 'Inline sparklines',
        description: 'Sparkline trails after each value give rolling trend context.',
        render: ({ width, ctx }) => renderStatsPanelStoryPreview([
          { label: 'FPS', value: '58', sparkline: [55, 60, 58, 62, 57, 60, 58, 61] },
          { label: 'frame', value: '17.2 ms', sparkline: [18, 16, 17, 15, 18, 17, 16, 17] },
          { label: 'heap', value: '42 MB', sparkline: [38, 40, 42, 41, 43, 42, 40, 42] },
        ], { title: 'Perf', width: Math.min(44, Math.max(30, width - 4)) }, ctx, width),
      },
    ],
    tags: ['visualization', 'metrics', 'panel', 'dashboard'],
  };
