import { CANONICAL_STORY_PROFILE_PRESETS, column, compositeSurface, drawer, line, spacer, toastBackdrop } from './stories-runtime.js';

import type { DogfoodComponentStory } from './stories-contract.js';

export const STORY_DRAWER: DogfoodComponentStory = {
    kind: 'component',
    id: 'drawer',
    coverageFamilyIds: ['overlay-primitives'],
    family: 'Overlays and interruption',
    title: 'drawer()',
    package: 'bijou-tui',
    docs: {
      summary: 'Anchored supplemental panel for sidecar context that should remain related to the current surface without blocking the whole task.',
      useWhen: [
        'The user needs supplemental context while keeping the main task visible.',
        'The panel belongs to a workspace edge or scoped region.',
        'The content is more durable than a tooltip but less interrupting than a modal.',
      ],
      avoidWhen: [
        'The user must make a blocking decision before continuing; prefer `modal()`.',
        'The content is a one-line explanation; prefer `tooltip()`.',
        'The event is transient and should disappear; prefer `toast()` or the notification system.',
      ],
      relatedFamilies: ['modal()', 'tooltip()', 'createFramedApp()'],
      gracefulLowering: {
        interactive: 'Anchored side panel over the current surface with visible ownership chrome.',
        static: 'Single deterministic drawer snapshot with the supplemented context visible.',
        pipe: 'Plain supplemental section placed after the current context.',
        accessible: 'Linear side-panel content with relationship to the active task made explicit.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'supplemental-right',
        label: 'Supplemental right drawer',
        description: 'Side context stays visible without turning into a blocking dialog.',
        render: ({ width, ctx }) => {
          if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
            return [
              'drawer: Release context',
              'Supplemental context for release dashboard',
              'Canaries stable in eu-west',
              'Queue depth low',
              'Action: watch rollout',
            ].join('\n');
          }

          const screenWidth = Math.max(40, width);
          const screenHeight = 12;
          const overlay = drawer({
            title: 'Release context',
            content: column([
              line('Canaries stable'),
              spacer(),
              line('Queue depth low'),
              line('Rollout window open'),
              spacer(),
              line('Action: watch rollout'),
            ]),
            anchor: 'right',
            width: Math.min(28, Math.max(16, screenWidth - 10)),
            screenWidth,
            screenHeight,
            borderToken: ctx.border('primary'),
            bgToken: ctx.surface('elevated'),
            ctx,
          });
          return compositeSurface(toastBackdrop(screenWidth, screenHeight, ctx), [overlay]);
        },
      },
      {
        id: 'bottom-review',
        label: 'Bottom review drawer',
        description: 'A bottom drawer can hold short review context without covering the whole workspace.',
        render: ({ width, ctx }) => {
          if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
            return [
              'drawer: Review queue',
              'Supplemental review panel',
              '2 migrations waiting',
              '1 config diff ready',
            ].join('\n');
          }

          const screenWidth = Math.max(40, width);
          const screenHeight = 12;
          const overlay = drawer({
            title: 'Review queue',
            content: column([
              line('2 migrations waiting'),
              line('1 config diff ready'),
              line('Press Enter to inspect'),
            ]),
            anchor: 'bottom',
            height: 5,
            screenWidth,
            screenHeight,
            borderToken: ctx.border('primary'),
            bgToken: ctx.surface('elevated'),
            ctx,
          });
          return compositeSurface(toastBackdrop(screenWidth, screenHeight, ctx), [overlay]);
        },
      },
    ],
    tags: ['overlay', 'drawer', 'supplemental'],
  };
