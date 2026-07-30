import { CANONICAL_STORY_PROFILE_PRESETS, alert } from './stories-runtime.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_ALERT: DogfoodComponentStory = {
    kind: 'component',
    id: 'alert',
    coverageFamilyIds: ['in-flow-status-block'],
    family: 'Status and in-flow feedback',
    title: 'alert()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Persistent in-flow status block for success, warning, error, and informational state that should remain part of the page instead of floating above it.',
      useWhen: [
        'A page or form needs a status callout that should stay visible while the user continues reading nearby content.',
        'You need an honest escalation step above `note()` but below shell-managed notifications or blocking overlays.',
        'The message needs graceful lowering across interactive, static, pipe, and accessible modes.',
      ],
      avoidWhen: [
        'The message is transient and should disappear on its own; prefer `toast()` or the notification system.',
        'The user must respond before continuing; prefer `modal()` or a confirmation flow.',
        'The content is purely decorative or ambient and does not change decision-making.',
      ],
      relatedFamilies: ['note()', 'toast()', 'renderNotificationStack()'],
      gracefulLowering: {
        interactive: 'Styled bordered block with a status icon and elevated background.',
        static: 'Single-frame bordered block with the same semantic iconography but no animation.',
        pipe: 'Bracketed status prefix like `[ERROR] message`.',
        accessible: 'Plain spoken prefix like `Error: message`.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'success',
        label: 'Success',
        description: 'Positive completion that should stay attached to the current task.',
        render: ({ ctx }) => alert('Deployment completed successfully.', { variant: 'success', ctx }),
      },
      {
        id: 'warning',
        label: 'Warning',
        description: 'The user can continue, but only after reading the caution.',
        render: ({ ctx }) => alert('Migrations are queued behind a schema lock. Review the rollout window.', {
          variant: 'warning',
          ctx,
        }),
      },
      {
        id: 'error',
        label: 'Error',
        description: 'The flow should stop until the user understands the failure.',
        render: ({ ctx }) => alert('Release failed: 3 workers did not acknowledge the new image.', {
          variant: 'error',
          ctx,
        }),
      },
    ],
    tags: ['status', 'feedback', 'lowering'],
  };
