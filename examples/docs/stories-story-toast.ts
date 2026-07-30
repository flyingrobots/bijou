import { CANONICAL_STORY_PROFILE_PRESETS, compositeSurface, toast, toastBackdrop } from './stories-runtime.js';

import type { DogfoodComponentStory } from './stories-contract.js';

export const STORY_TOAST: DogfoodComponentStory = {
    kind: 'component',
    id: 'toast',
    coverageFamilyIds: ['low-level-transient-overlay', 'overlay-primitives'],
    family: 'Feedback overlays and history',
    title: 'toast()',
    package: 'bijou-tui',
    docs: {
      summary: 'Low-level transient overlay primitive for one directly composed, anchored notification when the full notification system would be too heavy.',
      useWhen: [
        'You are composing one transient overlay directly inside a local surface.',
        'Explicit corner anchoring matters.',
        'The app does not need stacking, routing, actions, or history for this message.',
      ],
      avoidWhen: [
        'The app needs stacking, routing, actions, or recall; prefer the notification system.',
        'The message should stay in page flow; prefer `alert()` or `note()`.',
        'The surface needs supplemental work or a blocking decision; prefer `drawer()` or `modal()`.',
      ],
      relatedFamilies: ['alert()', 'notification system', 'modal()'],
      gracefulLowering: {
        interactive: 'Anchored transient overlay with explicit variant and placement over the current surface.',
        static: 'Single deterministic overlay frame preserving the same variant and placement.',
        pipe: 'Plain one-off event line or app-owned status output instead of a floating overlay.',
        accessible: 'Explicit announcement text describing the transient event without relying on spatial position.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'saved-top-right',
        label: 'Saved notification',
        description: 'A directly composed success toast anchored to the current working surface.',
        render: ({ width, ctx }) => {
          if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
            return [
              'toast: success',
              'Operation saved.',
            ].join('\n');
          }

          const screenWidth = Math.max(36, width);
          const screenHeight = 12;
          const overlay = toast({
            message: 'Operation saved.',
            variant: 'success',
            anchor: 'top-right',
            screenWidth,
            screenHeight,
            ctx,
          });
          return compositeSurface(toastBackdrop(screenWidth, screenHeight, ctx), [overlay]);
        },
      },
      {
        id: 'error-bottom-left',
        label: 'Anchored error',
        description: 'Low-level toast placement remains explicit when one local failure needs brief attention.',
        render: ({ width, ctx }) => {
          if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
            return [
              'toast: error',
              'Rollback required before promote.',
            ].join('\n');
          }

          const screenWidth = Math.max(36, width);
          const screenHeight = 12;
          const overlay = toast({
            message: 'Rollback required before promote.',
            variant: 'error',
            anchor: 'bottom-left',
            screenWidth,
            screenHeight,
            ctx,
          });
          return compositeSurface(toastBackdrop(screenWidth, screenHeight, ctx), [overlay]);
        },
      },
    ],
    tags: ['feedback', 'overlay', 'transient'],
  };
