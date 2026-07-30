import { CANONICAL_STORY_PROFILE_PRESETS, multiselectPreview } from './stories-runtime.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_MULTISELECT: DogfoodComponentStory = {
    kind: 'component',
    id: 'multiselect',
    coverageFamilyIds: ['multiple-choice'],
    family: 'Decision and selection forms',
    title: 'multiselect()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Set-selection prompt for building a durable group of choices with keyboard toggling and truthful numbered fallbacks.',
      useWhen: [
        'The user is choosing several members of one coherent set.',
        'Default selections should be visible before the user starts toggling.',
        'The flow should lower honestly to numbered or comma-separated selection outside rich mode.',
      ],
      avoidWhen: [
        'The result is singular; prefer `select()` or `filter()`.',
        'The rows are really actions or commands instead of lasting set members.',
        'The flow needs grouped validation or staged progression; prefer `group()` or `wizard()`.',
      ],
      relatedFamilies: ['select()', 'filter()', 'group()'],
      gracefulLowering: {
        interactive: 'Checkbox-style set selection with focus, toggling, and explicit confirmation.',
        static: 'Deterministic snapshot of the current set and visible choices.',
        pipe: 'Numbered textual selection with comma-separated input.',
        accessible: 'Plain text list that names which options are currently selected.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'release-stack',
        label: 'Release stack',
        description: 'Preselected tools keep the initial set obvious before the user starts changing it.',
        render: ({ width, ctx }) => multiselectPreview({
          width,
          ctx,
          title: 'Enable release checks:',
          options: [
            { label: 'TypeScript', description: 'type-safe JavaScript' },
            { label: 'Vitest', description: 'unit testing' },
            { label: 'Playwright', description: 'end-to-end tests' },
            { label: 'Docker', description: 'container packaging' },
          ],
          selectedIndices: [0, 1],
          focusedIndex: 1,
        }),
      },
      {
        id: 'notification-channels',
        label: 'Notification channels',
        description: 'Multiple related outputs can be chosen together without turning the flow into command dispatch.',
        render: ({ width, ctx }) => multiselectPreview({
          width,
          ctx,
          title: 'Notify rollout channels:',
          options: [
            { label: 'Slack', description: 'release room' },
            { label: 'Status page', description: 'customer-facing notice' },
            { label: 'PagerDuty', description: 'incident escalation' },
            { label: 'Email', description: 'stakeholder summary' },
          ],
          selectedIndices: [0, 1, 3],
          focusedIndex: 2,
        }),
      },
    ],
    tags: ['forms', 'selection', 'set-building'],
  };
