import { CANONICAL_STORY_PROFILE_PRESETS } from './stories-runtime.js';
import { frameNotificationRoutingPreview } from './stories-helper-frame-notification-routing-preview.js';
import { notificationPreview } from './stories-helper-notification-preview.js';

import type { DogfoodComponentStory } from './stories-contract.js';

export const STORY_NOTIFICATION_SYSTEM: DogfoodComponentStory = {
    kind: 'component',
    id: 'notification-system',
    coverageFamilyIds: ['notification-system'],
    family: 'Feedback overlays and history',
    title: 'renderNotificationStack() / renderNotificationHistorySurface() / createFramedApp()',
    package: 'bijou-tui',
    docs: {
      summary: 'Shell-owned transient messaging system with stacked live notifications, explicit placement, actions, archived review history, and framed runtime routing.',
      useWhen: [
        'The app owns transient messaging as a system instead of rendering one ad hoc overlay at a time.',
        'Warnings or follow-up prompts should be reviewable after the moment they first appear.',
        'Placement, stacking, and interruption level materially affect the user experience.',
      ],
      avoidWhen: [
        'The message should remain part of the normal page flow; prefer `alert()` or `note()`.',
        'A single local transient overlay is enough and no archive or routing matters.',
        'The user must stop and decide before continuing; prefer `modal()` or a confirmation flow.',
      ],
      relatedFamilies: ['toast()', 'modal()', 'alert()', 'createFramedApp()'],
      gracefulLowering: {
        interactive: 'Live stacked notifications, framed runtime routing, and archived review remain one system instead of scattered one-off overlays.',
        static: 'Current notifications, framed routing cues, or a truthful history snapshot stay visible without pretending transient timing still exists.',
        pipe: 'Sequential event text and archived warning/error records preserve the same system meaning in plain text.',
        accessible: 'Current and archived notices linearize with tone, action, and recall made explicit.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'live-stack',
        label: 'Live stack',
        description: 'System-owned stacked notifications can carry one clear next action without turning into mini workflows.',
        render: ({ width, ctx }) => notificationPreview({
          width,
          ctx,
          title: 'notification stack',
          mode: 'stack',
        }),
      },
      {
        id: 'history-review',
        label: 'History review',
        description: 'Archived notices remain reviewable instead of disappearing after the first interruption.',
        render: ({ width, ctx }) => notificationPreview({
          width,
          ctx,
          title: 'notification history',
          mode: 'history',
        }),
      },
      {
        id: 'framed-routing',
        label: 'Framed routing',
        description: 'Frame-managed runtime issues and page `notify()` commands route through the same notification system.',
        render: ({ width, ctx }) => frameNotificationRoutingPreview({
          width,
          ctx,
          title: 'framed notifications',
        }),
      },
    ],
    source: {
      examplePath: 'examples/notifications/main.ts',
      snippetLabel: 'Stacked notifications and archived review',
    },
    tags: ['notifications', 'history', 'shell'],
  };
