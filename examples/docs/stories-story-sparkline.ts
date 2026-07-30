import { CANONICAL_STORY_PROFILE_PRESETS } from './stories-runtime.js';
import { renderSparklineStoryPreview } from './stories-helper-render-sparkline-story-preview.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_SPARKLINE: DogfoodComponentStory = {
    kind: 'component',
    id: 'sparkline',
    coverageFamilyIds: ['data-visualization'],
    family: 'Data visualization',
    title: 'sparkline()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Compact inline trend graph using Unicode block characters — a glanceable shape next to a label instead of a number alone.',
      useWhen: [
        'A numeric trend is more informative than the latest scalar value.',
        'The graph must fit inline beside a label or inside a table cell.',
        'You have a rolling window of 8–60 samples and need instant visual context.',
      ],
      avoidWhen: [
        'The user needs exact numeric values — use a table or formatted number.',
        'The data needs area-chart density or sub-pixel smoothness — use brailleChartSurface().',
        'The visualization is decorative and does not change decision-making.',
      ],
      relatedFamilies: ['brailleChartSurface()', 'statsPanelSurface()', 'progressBar()'],
      gracefulLowering: {
        interactive: 'Unicode block characters (▁▂▃▄▅▆▇█) with optional semantic color.',
        static: 'Same block rendering, no animation.',
        pipe: 'Plain trend summary with range, latest value, and a compact sample list.',
        accessible: 'Trend summary stating sample count, range, start/end, and overall direction.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'basic',
        label: 'Basic trend',
        description: 'Raw block-character rendering of a short time series.',
        render: ({ width, ctx }) => renderSparklineStoryPreview(
          [1, 5, 3, 8, 2, 7, 4, 6, 9, 3],
          {},
          ctx,
          width,
        ),
      },
      {
        id: 'fixed-width',
        label: 'Fixed width',
        description: 'Values resampled to fit a specific character width.',
        render: ({ width, ctx }) => renderSparklineStoryPreview(
          [10, 20, 15, 40, 35, 25, 30, 50, 45, 20, 10, 30, 60, 55, 40],
          { width: Math.max(8, width - 4) },
          ctx,
          width,
        ),
      },
      {
        id: 'explicit-range',
        label: 'Explicit min/max',
        description: 'Fixed axis bounds for stable cross-comparison.',
        render: ({ width, ctx }) => renderSparklineStoryPreview(
          [3, 5, 4, 6, 5, 7],
          { min: 0, max: 10 },
          ctx,
          width,
        ),
      },
    ],
    tags: ['visualization', 'inline', 'trend'],
  };
