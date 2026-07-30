import { CANONICAL_STORY_PROFILE_PRESETS, boxSurface, column, contentSurface, line, skeleton, spacer } from './stories-runtime.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_SKELETON: DogfoodComponentStory = {
    kind: 'component',
    id: 'skeleton',
    coverageFamilyIds: ['loading-placeholders'],
    family: 'Progress and loading',
    title: 'skeleton()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Shape-preserving loading placeholder for short-lived uncertainty when you know the information layout but not the data yet.',
      useWhen: [
        'The final content shape is known and preserving layout stability helps more than a separate loading page.',
        'The loading window is short enough that a placeholder remains believable.',
        'The surrounding labels can stay explicit so the user knows what is loading.',
      ],
      avoidWhen: [
        'Real partial content can already be shown honestly.',
        'The delay is long enough that a clearer progress indicator, retry path, or durable message is needed.',
        'The placeholder would become decorative filler instead of a faithful stand-in for the final layout.',
      ],
      relatedFamilies: ['progressBar()', 'spinnerFrame()', 'note()'],
      gracefulLowering: {
        interactive: 'Placeholder bars preserve approximate content shape while loading is genuinely transient.',
        static: 'Single deterministic placeholder frame with the same layout footprint.',
        pipe: 'Explicit loading text or field labels instead of decorative placeholder bars.',
        accessible: 'Plain loading-state language describing the affected region instead of relying on shape alone.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'form-shell',
        label: 'Form shell',
        description: 'Short-lived placeholders that preserve a known form layout without implying fake text.',
        render: ({ ctx }) => boxSurface(column([
          line('Name'),
          contentSurface(skeleton({ width: 26, ctx })),
          spacer(),
          line('Description'),
          contentSurface(skeleton({ width: 34, lines: 3, ctx })),
          spacer(),
          line('Owner'),
          contentSurface(skeleton({ width: 18, ctx })),
        ]), {
          title: 'new package',
          width: 40,
          ctx,
        }),
      },
      {
        id: 'card-region',
        label: 'Card region',
        description: 'Region-shaped placeholders that match the density of a summary card instead of spraying generic bars everywhere.',
        render: ({ ctx }) => boxSurface(column([
          line('Package summary'),
          spacer(),
          contentSurface(skeleton({ width: 32, lines: 2, ctx })),
          spacer(),
          line('Recent activity'),
          contentSurface(skeleton({ width: 28, lines: 3, ctx })),
        ]), {
          title: 'registry overview',
          width: 38,
          ctx,
        }),
      },
    ],
    tags: ['loading', 'placeholder', 'layout'],
  };
