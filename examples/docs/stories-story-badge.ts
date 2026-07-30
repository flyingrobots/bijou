import { CANONICAL_STORY_PROFILE_PRESETS, badgeSurface, column, row, spacer } from './stories-runtime.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_BADGE: DogfoodComponentStory = {
    kind: 'component',
    id: 'badge',
    coverageFamilyIds: ['inline-status'],
    family: 'Status and in-flow feedback',
    title: 'badge()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Compact inline status label for states that belong beside another object instead of becoming their own block.',
      useWhen: [
        'A state needs to stay attached to a row, heading, or summary instead of interrupting the layout.',
        'The label can stay short, stable, and glanceable.',
        'You need lightweight semantic emphasis that still lowers honestly outside rich mode.',
      ],
      avoidWhen: [
        'The message needs explanation or next-step guidance; prefer `alert()` or `note()`.',
        'The content is long enough to become a sentence instead of a label.',
        'The user must acknowledge the state before continuing.',
      ],
      relatedFamilies: ['alert()', 'note()', 'notification system'],
      gracefulLowering: {
        interactive: 'Compact themed inline chip that stays attached to the owning object.',
        static: 'Single-frame inline chip preserving the same terse label.',
        pipe: 'Plain inline text status label without depending on color.',
        accessible: 'Explicit spoken status next to the owning object in plain language.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'service-health',
        label: 'Service health',
        description: 'Inline status labels attached to operational rows instead of detached callouts.',
        render: ({ ctx }) => column([
          row(['api    ', badgeSurface('LIVE', 'success', ctx), '  p95 84ms']),
          spacer(),
          row(['queue  ', badgeSurface('DEGRADED', 'warning', ctx), '  backlog 12']),
          spacer(),
          row(['cron   ', badgeSurface('PAUSED', 'muted', ctx), '  waiting for window']),
        ]),
      },
      {
        id: 'release-metadata',
        label: 'Release metadata',
        description: 'Short supporting labels that belong inline with other metadata.',
        render: ({ ctx }) => column([
          row([
            badgeSurface('v4.0.0', 'accent', ctx),
            ' ',
            badgeSurface('MIT', 'muted', ctx),
            ' ',
            badgeSurface('TypeScript', 'info', ctx),
          ]),
          spacer(),
          row([
            'Server is ',
            badgeSurface('RUNNING', 'success', ctx),
            ' on port ',
            badgeSurface('3000', 'primary', ctx),
          ]),
        ]),
      },
    ],
    tags: ['status', 'inline', 'labels'],
  };
