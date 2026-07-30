import { CANONICAL_STORY_PROFILE_PRESETS, boxSurface, column, compositeSurface, kbd, line, screenSurface, spacer, tooltip } from './stories-runtime.js';

import type { DogfoodComponentStory } from './stories-contract.js';

export const STORY_TOOLTIP: DogfoodComponentStory = {
    kind: 'component',
    id: 'tooltip',
    coverageFamilyIds: ['overlay-primitives'],
    family: 'Overlays and interruption',
    title: 'tooltip()',
    package: 'bijou-tui',
    docs: {
      summary: 'Short local explanation positioned near the thing it describes, for cases where the meaning is helpful but not part of the document flow.',
      useWhen: [
        'A nearby label or control needs a terse explanation.',
        'The explanation is local, non-blocking, and short-lived.',
        'Position relative to the target helps more than adding permanent copy.',
      ],
      avoidWhen: [
        'The content is actionable or scrollable; prefer `drawer()` or in-flow help.',
        'The user must acknowledge it; prefer `modal()`.',
        'The message is an event or status; prefer `toast()` or notification system.',
      ],
      relatedFamilies: ['drawer()', 'modal()', 'kbd()'],
      gracefulLowering: {
        interactive: 'Positioned explanatory overlay clamped to the screen bounds.',
        static: 'Visible explanation snapshot near the target.',
        pipe: 'Plain parenthetical explanation next to the related label.',
        accessible: 'Inline explanatory text associated with the target label.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'local-explanation',
        label: 'Local explanation',
        description: 'Tooltip content explains one nearby action without becoming a command surface.',
        render: ({ width, ctx }) => {
          if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
            return [
              'tooltip: Command palette',
              'Explains: Search actions and docs without leaving the current page.',
            ].join('\n');
          }

          const screenWidth = Math.max(36, width);
          const screenHeight = 10;
          const background = screenSurface(screenWidth, screenHeight, boxSurface(column([
            line('Docs toolbar'),
            spacer(),
            line(`${kbd('cmd+k', { ctx })} Command palette`),
          ]), {
            title: 'toolbar',
            width: Math.max(28, screenWidth - 6),
            ctx,
          }), 2, 2);
          const overlay = tooltip({
            content: 'Search actions and docs',
            row: 5,
            col: Math.min(screenWidth - 6, 18),
            direction: 'bottom',
            screenWidth,
            screenHeight,
            borderToken: ctx.border('primary'),
            bgToken: ctx.surface('elevated'),
            ctx,
          });
          return compositeSurface(background, [overlay]);
        },
      },
      {
        id: 'clamped-edge',
        label: 'Clamped edge',
        description: 'Tooltip placement clamps to the viewport instead of overflowing the screen.',
        render: ({ width, ctx }) => {
          if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
            return [
              'tooltip: Edge action',
              'Explains: Runs verification for the selected release.',
            ].join('\n');
          }

          const screenWidth = Math.max(36, width);
          const screenHeight = 10;
          const background = screenSurface(screenWidth, screenHeight, boxSurface(column([
            line('Release actions'),
            spacer(),
            line('Verify release'),
          ]), {
            title: 'actions',
            width: Math.max(28, screenWidth - 6),
            ctx,
          }), 2, 2);
          const overlay = tooltip({
            content: 'Runs verification for the selected release',
            row: 1,
            col: screenWidth - 2,
            direction: 'right',
            screenWidth,
            screenHeight,
            borderToken: ctx.border('primary'),
            bgToken: ctx.surface('elevated'),
            ctx,
          });
          return compositeSurface(background, [overlay]);
        },
      },
    ],
    tags: ['overlay', 'tooltip', 'explanation'],
  };
