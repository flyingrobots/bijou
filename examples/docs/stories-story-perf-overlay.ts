import { CANONICAL_STORY_PROFILE_PRESETS } from './stories-runtime.js';
import { renderPerfOverlayStoryPreview } from './stories-helper-render-perf-overlay-story-preview.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_PERF_OVERLAY: DogfoodComponentStory = {
    kind: 'component',
    id: 'perf-overlay',
    coverageFamilyIds: ['data-visualization'],
    family: 'Data visualization',
    title: 'perfOverlaySurface()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Prebuilt FPS + memory dashboard composing statsPanelSurface and brailleChartSurface — drop-in performance overlay for any app.',
      useWhen: [
        'You need a ready-made FPS and memory dashboard without wiring stats and charts manually.',
        'A performance overlay should be blittable onto an existing app surface.',
        'The app tracks frame time history and wants a chart alongside numeric metrics.',
      ],
      avoidWhen: [
        'The metrics are domain-specific rather than runtime performance — use statsPanelSurface() directly.',
        'You need a custom chart layout that does not match the stats-on-top chart-below pattern.',
        'The overlay is permanent and would obstruct primary content — reconsider placement.',
      ],
      relatedFamilies: ['statsPanelSurface()', 'brailleChartSurface()', 'sparkline()'],
      gracefulLowering: {
        interactive: 'Stats panel with braille area chart, semantic color tokens.',
        static: 'Same panel and chart layout, single-frame snapshot.',
        pipe: 'FPS/memory lines plus frame-time trend summary in plain text.',
        accessible: 'Spoken metric summary with frame-time trend described explicitly.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'basic',
        label: 'Standard overlay',
        description: 'FPS, frame time, and memory with a braille frame-time chart.',
        render: ({ width, ctx }) => renderPerfOverlayStoryPreview({
          fps: 60,
          frameTimeMs: 16.7,
          frameTimeHistory: [18, 16, 17, 15, 18, 17, 16, 17, 15, 16, 18, 17, 16, 15, 17, 16],
          width: 120,
          height: 40,
          heapUsedMB: 42.1,
          rssMB: 128,
        }, {}, ctx, width),
      },
      {
        id: 'no-chart',
        label: 'Stats only',
        description: 'Compact panel without the braille chart for tight spaces.',
        render: ({ width, ctx }) => renderPerfOverlayStoryPreview({
          fps: 30,
          frameTimeMs: 33.3,
          width: 80,
          height: 24,
          heapUsedMB: 64.2,
        }, { showChart: false }, ctx, width),
      },
    ],
    tags: ['visualization', 'performance', 'overlay', 'dashboard'],
  };
