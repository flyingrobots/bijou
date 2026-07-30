import { CANONICAL_STORY_PROFILE_PRESETS } from './stories-runtime.js';
import type { BijouContext } from './stories-runtime.js';
import { denseComparisonPreview } from './stories-helper-dense-comparison-preview.js';
import { tablePipeFormatDescription } from './stories-helper-table-pipe-format-description.js';
import { tablePipeFormatPreview } from './stories-helper-table-pipe-format-preview.js';
import { TABLE_PIPE_FORMAT_STORIES } from './stories-helper-table-pipe-format-stories.js';
import { tableStoryLabel } from './stories-helper-table-story-label.js';
import { tableVisualVariantDescription } from './stories-helper-table-visual-variant-description.js';
import { tableVisualVariantPreview } from './stories-helper-table-visual-variant-preview.js';
import { TABLE_VISUAL_VARIANT_STORIES } from './stories-helper-table-visual-variant-stories.js';

import type { DogfoodComponentStory } from './stories-contract.js';

export const STORY_DENSE_COMPARISON: DogfoodComponentStory = {
    kind: 'component',
    id: 'dense-comparison',
    coverageFamilyIds: ['dense-comparison'],
    family: 'Data and browsing',
    title: 'table() / navigableTableSurface()',
    package: 'bijou-tui',
    docs: {
      summary: 'Dense comparison family for row-and-column inspection, responsive table variants, explicit pipe serializations, and keyboard-owned row focus.',
      useWhen: [
        'Row and column comparison is the main job.',
        'Headers describe comparable attributes and the table remains compact enough to stay readable.',
        'The output needs a named table style or explicit pipe/data serialization.',
        'Keyboard-owned row inspection materially helps the task.',
      ],
      avoidWhen: [
        'Hierarchy or dependencies dominate the meaning; prefer `tree()` or `dag()`.',
        'The data is really one-dimensional and should read like a list.',
        'The rows wrap so heavily that comparison stops being honest.',
      ],
      relatedFamilies: ['browsableListSurface()', 'tree()', 'navigableTableSurface()'],
      gracefulLowering: {
        interactive: 'Responsive visual variants preserve headers, wrapped cells, and optional row focus.',
        static: 'Single-frame dense comparison remains visible with the selected visual variant.',
        pipe: 'TSV remains the default, while CSV, Markdown, and ASCII grid are explicit serializations.',
        accessible: 'Headers, row labels, and focused comparison state remain clear in text.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      ...TABLE_VISUAL_VARIANT_STORIES.map(spec => ({
        id: spec.id,
        label: tableStoryLabel(spec.id),
        description: tableVisualVariantDescription(spec),
        render: ({ width, ctx }: { readonly width: number; readonly ctx: BijouContext }) => tableVisualVariantPreview({
          width,
          ctx,
          title: `variant: ${spec.variant}`,
          variant: spec.variant,
        }),
      })),
      ...TABLE_PIPE_FORMAT_STORIES.map(spec => ({
        id: spec.id,
        label: tableStoryLabel(spec.id),
        description: tablePipeFormatDescription(spec),
        render: ({ width, ctx }: { readonly width: number; readonly ctx: BijouContext }) => tablePipeFormatPreview({
          width,
          ctx,
          title: `pipeFormat: ${spec.pipeFormat}`,
          pipeFormat: spec.pipeFormat,
        }),
      })),
      {
        id: 'focused-inspection',
        label: 'Focused inspection',
        description: 'The TUI path adds row-aware focus without collapsing the table into a generic list.',
        render: ({ width, ctx }) => denseComparisonPreview({
          width,
          ctx,
          title: 'focused table',
        }),
      },
    ],
    tags: ['table', 'comparison', 'data'],
  };
