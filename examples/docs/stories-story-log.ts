import { CANONICAL_STORY_PROFILE_PRESETS, box, log } from './stories-runtime.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_LOG: DogfoodComponentStory = {
    kind: 'component',
    id: 'log',
    coverageFamilyIds: ['activity-stream'],
    family: 'Feedback overlays and history',
    title: 'log()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Chronological activity-stream primitive for accumulating operational events with explicit severity and optional timestamps.',
      useWhen: [
        'Order and accumulation matter more than interruption.',
        'The user benefits from scanning a timeline of events instead of only the latest status.',
        'The output should remain honest in pipe and accessible modes as plain chronological text.',
      ],
      avoidWhen: [
        'The message should interrupt or demand immediate attention; prefer `alert()` or `toast()`.',
        'A single inline label or current status is enough.',
        'The user needs a summary panel instead of raw chronological events.',
      ],
      relatedFamilies: ['notification system', 'alert()', 'badge()'],
      gracefulLowering: {
        interactive: 'Chronological lines with level cues and optional timestamps remain scannable in place.',
        static: 'Single deterministic activity transcript preserving order and severity cues.',
        pipe: 'Plain sequential output is already a natural fit.',
        accessible: 'Timestamps and levels stay explicit in linear text without decorative formatting.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'release-events',
        label: 'Release events',
        description: 'Chronological accumulation of mixed-severity deployment events.',
        render: ({ ctx }) => box([
          log('debug', 'Connecting to release queue...', { ctx }),
          log('info', 'Canary started in eu-west', { ctx }),
          log('warn', '2 workers still draining old jobs', { ctx }),
          log('error', 'One verification probe timed out', { ctx }),
        ].join('\n'), {
          title: 'activity stream',
          width: 54,
          ctx,
        }),
      },
      {
        id: 'timed-audit',
        label: 'Timed audit',
        description: 'Optional timestamps help when the event order itself needs auditing.',
        render: ({ ctx }) => box([
          log('info', 'Rollout window opened', { timestamp: true, ctx }),
          log('info', 'Canaries reached 25%', { timestamp: true, ctx }),
          log('warn', 'Waiting on staging approval', { timestamp: true, ctx }),
        ].join('\n'), {
          title: 'release audit',
          width: 54,
          ctx,
        }),
      },
    ],
    tags: ['feedback', 'history', 'events'],
  };
