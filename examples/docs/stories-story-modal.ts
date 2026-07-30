import { CANONICAL_STORY_PROFILE_PRESETS, column, compositeSurface, kbd, line, modal, modalBackdrop, spacer } from './stories-runtime.js';

import type { DogfoodComponentStory } from './stories-contract.js';

export const STORY_MODAL: DogfoodComponentStory = {
    kind: 'component',
    id: 'modal',
    coverageFamilyIds: ['overlay-primitives'],
    family: 'Overlays and interruption',
    title: 'modal()',
    package: 'bijou-tui',
    docs: {
      summary: 'Centered blocking dialog for decisions that should temporarily own attention and input inside a TUI surface.',
      useWhen: [
        'The user must acknowledge or answer before the rest of the surface should accept more input.',
        'The dialog content is short, focused, and directly tied to the current surface state.',
        'You need shell-owned interruption, not a long-lived inspector or sidecar workspace.',
      ],
      avoidWhen: [
        'The content is supplemental and can live beside the main task; prefer `drawer()`.',
        'The message is low-severity and transient; prefer `toast()` or the notification stack.',
        'The body is long-form documentation or persistent inspection chrome.',
      ],
      relatedFamilies: ['drawer()', 'tooltip()', 'toast()'],
      gracefulLowering: {
        interactive: 'Centered bordered overlay dimming the background and temporarily owning input focus.',
        static: 'Single-frame snapshot of the blocking dialog for deterministic screenshots and CI.',
        pipe: 'Recommended lowering is an in-flow confirmation prompt or status note rather than a floating overlay.',
        accessible: 'Recommended lowering is explicit linear confirmation text with direct action language.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'confirm',
        label: 'Confirm deploy',
        description: 'Short blocking decision with explicit yes/no guidance.',
        render: ({ width, ctx }) => {
          if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
            return [
              'modal: Confirm deploy',
              'Deploy release-control to production?',
              'This will roll all workers and re-open the queue.',
              'Actions: y yes, n no, esc cancel',
            ].join('\n');
          }

          const screenWidth = Math.max(32, width);
          const screenHeight = 14;
          const background = modalBackdrop(screenWidth, ctx);
          const dialog = modal({
            title: 'Confirm deploy',
            body: column([
              line('Deploy release-control to production?'),
              spacer(),
              line('This will roll all workers and re-open the queue.'),
            ]),
            hint: line(`${kbd('y', { ctx })} yes • ${kbd('n', { ctx })} no • ${kbd('esc', { ctx })} cancel`),
            screenWidth,
            screenHeight,
            borderToken: ctx.border('primary'),
            bgToken: ctx.surface('elevated'),
            ctx,
          });
          return compositeSurface(background, [dialog], { dim: true });
        },
      },
      {
        id: 'help',
        label: 'Shortcut help',
        description: 'Small focused explanation for the current surface, not a full settings page.',
        render: ({ width, ctx }) => {
          if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
            return [
              'modal: Keyboard help',
              'j/k: Move between stories',
              '1-4: Switch profile',
              ',/.: Cycle variants',
              'esc: return to the page',
            ].join('\n');
          }

          const screenWidth = Math.max(32, width);
          const screenHeight = 14;
          const background = modalBackdrop(screenWidth, ctx);
          const dialog = modal({
            title: 'Keyboard help',
            body: column([
              line(`${kbd('j', { ctx })} ${kbd('k', { ctx })}  Move between stories`),
              line(`${kbd('1', { ctx })}…${kbd('4', { ctx })}  Switch profile`),
              line(`${kbd(',', { ctx })} ${kbd('.', { ctx })}  Cycle variants`),
            ]),
            hint: line(`Press ${kbd('esc', { ctx })} to return to the page`),
            screenWidth,
            screenHeight,
            borderToken: ctx.border('primary'),
            bgToken: ctx.surface('elevated'),
            ctx,
          });
          return compositeSurface(background, [dialog], { dim: true });
        },
      },
    ],
    tags: ['overlay', 'interruption', 'surface'],
  };
