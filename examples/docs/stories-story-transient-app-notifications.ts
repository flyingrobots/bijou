import { CANONICAL_STORY_PROFILE_PRESETS } from './stories-runtime.js';
import { transientAppNotificationPreview } from './stories-helper-transient-app-notification-preview.js';

import type { DogfoodComponentStory } from './stories-contract.js';

export const STORY_TRANSIENT_APP_NOTIFICATIONS: DogfoodComponentStory = {
    kind: 'component',
    id: 'transient-app-notifications',
    coverageFamilyIds: ['transient-app-notifications'],
    family: 'Feedback overlays and history',
    title: 'pushNotification() / renderNotificationStack()',
    package: 'bijou-tui',
    docs: {
      summary: 'App-owned transient notification family for live stacked events, tones, actions, and placements before archived review or broader shell routing becomes the main concern.',
      useWhen: [
        'The app owns transient event messaging and placement materially affects interruption level.',
        'A notice may need one clear next action without turning into a mini workflow.',
        'The system should feel richer than one raw toast primitive but does not need the whole review/archive story in the current moment.',
      ],
      avoidWhen: [
        'The content should remain in page flow; prefer `alert()` or `note()`.',
        'One directly composed local overlay is enough; prefer `toast()`.',
        'The user mainly needs chronological recall and archived review; move up to the full notification-system history surfaces.',
      ],
      relatedFamilies: ['toast()', 'notification system', 'modal()'],
      gracefulLowering: {
        interactive: 'Stacked app-owned notices with tones, placement, and optional actions.',
        static: 'Single deterministic live-notice snapshot preserving stacking and tone.',
        pipe: 'Plain chronological event lines with action language kept explicit.',
        accessible: 'Linearized transient notices that preserve action, severity, and ordering without spatial assumptions.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'actionable-live',
        label: 'Actionable live notice',
        description: 'One clear next action stays attached to the live transient event.',
        render: ({ width, ctx }) => transientAppNotificationPreview({
          width,
          ctx,
          title: 'transient notifications',
          mode: 'actionable',
        }),
      },
      {
        id: 'mixed-variants',
        label: 'Mixed live variants',
        description: 'App-owned transient notices can mix inline and toast variants without becoming the history view.',
        render: ({ width, ctx }) => transientAppNotificationPreview({
          width,
          ctx,
          title: 'mixed live notices',
          mode: 'mixed',
        }),
      },
    ],
    source: {
      examplePath: 'examples/notifications/main.ts',
      snippetLabel: 'Live transient notifications',
    },
    tags: ['notifications', 'transient', 'stack'],
  };
