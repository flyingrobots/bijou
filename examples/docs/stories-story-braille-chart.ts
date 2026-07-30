import { CANONICAL_STORY_PROFILE_PRESETS } from './stories-runtime.js';
import { renderBrailleChartStoryPreview } from './stories-helper-render-braille-chart-story-preview.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_BRAILLE_CHART: DogfoodComponentStory = {
    kind: 'component',
    id: 'braille-chart',
    coverageFamilyIds: ['data-visualization'],
    family: 'Data visualization',
    title: 'brailleChartSurface()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'High-density filled area chart using Unicode Braille characters — 2×4 sub-pixel resolution per terminal cell for smooth curves in tight space.',
      useWhen: [
        'The data deserves area-chart density and sub-pixel smoothness.',
        'A filled shape conveys volume or magnitude better than a line.',
        'You need a chart in a fixed region (e.g. dashboard pane or overlay).',
      ],
      avoidWhen: [
        'A sparkline is sufficient and width is critical — use sparkline().',
        'Exact numeric values must be readable from the chart — use a table.',
        'The terminal may not support Unicode Braille rendering.',
      ],
      relatedFamilies: ['sparkline()', 'statsPanelSurface()', 'perfOverlaySurface()'],
      gracefulLowering: {
        interactive: 'Braille-dot area chart with semantic color tokens.',
        static: 'Same Braille rendering, no animation.',
        pipe: 'Plain trend summary with range, peak, and latest value instead of Braille area fill.',
        accessible: 'Area-chart meaning restated as sample count, range, peak, and direction in reading order.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'basic',
        label: 'Basic area chart',
        description: 'Auto-scaled filled area chart.',
        render: ({ width, ctx }) => renderBrailleChartStoryPreview(
          [1, 4, 2, 8, 5, 7, 3, 9, 6, 4, 2, 5, 8, 7, 3, 6, 9, 5, 2, 4],
          { width: Math.max(10, width - 4), height: 6 },
          ctx,
          width,
        ),
      },
      {
        id: 'explicit-range',
        label: 'Explicit min/max',
        description: 'Fixed axis range for stable comparison across variants.',
        render: ({ width, ctx }) => renderBrailleChartStoryPreview(
          [1, 4, 2, 8, 5, 7, 3, 9, 6, 4, 2, 5, 8, 7, 3, 6, 9, 5, 2, 4],
          { width: Math.max(10, width - 4), height: 6, min: 0, max: 10 },
          ctx,
          width,
        ),
      },
    ],
    tags: ['visualization', 'chart', 'braille', 'time-series'],
  };
