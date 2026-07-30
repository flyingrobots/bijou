import { CANONICAL_STORY_PROFILE_PRESETS, mutedText } from './stories-runtime.js';
import { dividerPreview } from './stories-helper-divider-preview.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_SEPARATOR: DogfoodComponentStory = {
    kind: 'component',
    id: 'separator',
    coverageFamilyIds: ['dividers'],
    family: 'Structural grouping and inspection',
    title: 'separator() / separatorSurface()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Section-boundary primitive for marking real transitions without promoting every boundary into a boxed panel.',
      useWhen: [
        'A section break is needed, but full containment would add more chrome than clarity.',
        'A label can name the next section or state more honestly than another repeated heading.',
        'The layout needs calmer rhythm between clusters of related content.',
      ],
      avoidWhen: [
        'The content needs its own grouped region or titled panel; prefer `box()` or `inspector()`.',
        'The dividers would become decorative stripes rather than meaningful structure.',
        'The label would only repeat an already-visible page title.',
      ],
      relatedFamilies: ['box()', 'tabs()', 'breadcrumb()'],
      gracefulLowering: {
        interactive: 'Visual rules and labeled separators mark real boundaries without over-boxing the layout.',
        static: 'Deterministic divider treatment keeps the same section rhythm and labels.',
        pipe: 'Plain text separators or labels preserve the boundary without decorative dependence.',
        accessible: 'Section boundaries stay explicit through labels and reading order, not just visual lines.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'labeled-breaks',
        label: 'Labeled breaks',
        description: 'Labels should name the next section instead of repeating the current page title.',
        render: ({ width, ctx }) => dividerPreview({
          width,
          ctx,
          title: 'release review',
          sections: [
            {
              lines: [
                'Preflight checks are green.',
                mutedText(ctx, 'No blocking migrations or schema locks are active.'),
              ],
            },
            {
              label: 'Promote canaries',
              lines: [
                'Two regions are ready for promotion.',
                mutedText(ctx, 'Use labeled dividers when the boundary itself needs a name.'),
              ],
            },
            {
              label: 'Aftercare',
              lines: [
                'Watch latency for 15 minutes after promotion.',
              ],
            },
          ],
        }),
      },
      {
        id: 'quiet-rhythm',
        label: 'Quiet rhythm',
        description: 'Unlabeled dividers can separate short sibling clusters without turning them into separate boxes.',
        render: ({ width, ctx }) => dividerPreview({
          width,
          ctx,
          title: 'ops checklist',
          sections: [
            {
              lines: ['Confirm deploy window'],
            },
            {
              lines: ['Page the fallback owner'],
            },
            {
              lines: ['Archive the rollout notes'],
            },
          ],
        }),
      },
    ],
    tags: ['structure', 'rhythm', 'dividers'],
  };
