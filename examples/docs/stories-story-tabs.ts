import { CANONICAL_STORY_PROFILE_PRESETS, box, infoText, mutedText, tabs } from './stories-runtime.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_TABS: DogfoodComponentStory = {
    kind: 'component',
    id: 'tabs',
    coverageFamilyIds: ['peer-navigation'],
    family: 'Navigation and organization',
    title: 'tabs()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Peer-navigation strip for switching between sibling sections that share one workspace and one conceptual level.',
      useWhen: [
        'The user is moving between peer sections of the same task or document.',
        'One active sibling needs to stay obvious without implying progress or hierarchy.',
        'The labels can stay short enough to scan inline as one navigation band.',
      ],
      avoidWhen: [
        'The steps imply sequence or completion; prefer `stepper()` or another progress-oriented surface.',
        'The content is hierarchical rather than peer-level; prefer `tree()` or progressive disclosure.',
        'The labels are so numerous or verbose that the strip stops being glanceable.',
      ],
      relatedFamilies: ['breadcrumb()', 'paginator()', 'accordion()'],
      gracefulLowering: {
        interactive: 'Active tab stays visually distinct while sibling sections remain visible beside it.',
        static: 'Single deterministic tab strip preserves the same peer relationship and active section.',
        pipe: 'Plain text tab labels keep the active peer explicit with bracketed emphasis.',
        accessible: 'Each peer section is read explicitly with active state called out in order.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'release-workbench',
        label: 'Release workbench',
        description: 'Peer operational sections stay visible as one band without implying a step-by-step wizard.',
        render: ({ ctx }) => box([
          tabs([
            { label: 'Overview' },
            { label: 'Checks', badge: '3' },
            { label: 'Rollout', badge: '2' },
            { label: 'Logs' },
          ], { active: 2, ctx }),
          '',
          `Current pane: ${infoText(ctx, 'Rollout')}`,
          mutedText(ctx, 'Peer sections share one workspace; switching does not imply completion.'),
        ].join('\n'), {
          title: 'peer navigation',
          width: 60,
          ctx,
        }),
      },
      {
        id: 'settings-sections',
        label: 'Settings sections',
        description: 'Compact peer sections remain readable even when one carries supporting metadata.',
        render: ({ ctx }) => box([
          tabs([
            { label: 'General' },
            { label: 'Appearance' },
            { label: 'Notifications', badge: '2' },
          ], { active: 1, ctx }),
          '',
          `Current pane: ${infoText(ctx, 'Appearance')}`,
          mutedText(ctx, 'Use tabs when the user is switching sibling sections, not confirming steps.'),
        ].join('\n'), {
          title: 'settings sections',
          width: 56,
          ctx,
        }),
      },
    ],
    tags: ['navigation', 'tabs', 'organization'],
  };
