import { CANONICAL_STORY_PROFILE_PRESETS, inspector } from './stories-runtime.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_INSPECTOR: DogfoodComponentStory = {
    kind: 'component',
    id: 'inspector',
    coverageFamilyIds: ['inspector-panels'],
    family: 'Structural grouping and inspection',
    title: 'inspector()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Canonical side-panel summary surface for the currently selected thing, keeping one obvious active value and calmer supporting sections nearby.',
      useWhen: [
        'A side panel needs to summarize the currently selected object without taking over the main task.',
        'One obvious active value should stay more prominent than the supporting details beneath it.',
        'Supporting context benefits from compact titled sections instead of freeform prose.',
      ],
      avoidWhen: [
        'The content is a guided recommendation with evidence and next-action structure; prefer `explainability()`.',
        'The content is only a one-line status or note.',
        'The panel needs its own deep navigation or multistep interaction model.',
      ],
      relatedFamilies: ['box()', 'explainability()', 'preferenceListSurface()'],
      gracefulLowering: {
        interactive: 'Titled containment, current-selection emphasis, and compact section rhythm stay visible in one calm panel.',
        static: 'Single deterministic panel preserves the same hierarchy without motion.',
        pipe: 'Explicit field labels keep the current selection obvious in plain grouped text.',
        accessible: 'Linearized plain-language fields preserve the same meaning without borders or color.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'package-summary',
        label: 'Package summary',
        description: 'A current selection with concise supporting sections that stay calmer than the main value.',
        render: ({ ctx }) => inspector({
          title: 'package summary',
          currentValue: 'release-control',
          supportingText: 'Currently selected package in the registry overview.',
          sections: [
            { title: 'Owner', content: 'Platform' },
            { title: 'Profile', content: 'Rich' },
            {
              title: 'Description',
              content: 'Coordinates the release queue, rollout window, and production promotion handoff.',
              tone: 'muted',
            },
          ],
          width: 40,
          ctx,
        }),
      },
      {
        id: 'rollout-review',
        label: 'Rollout review',
        description: 'Inspector rhythm stays useful for operational review without turning into a second page.',
        render: ({ ctx }) => inspector({
          title: 'active rollout',
          currentValue: 'canary-eu-west',
          supportingText: 'Watching the currently selected rollout slice before promotion.',
          sections: [
            { title: 'Health', content: 'Stable • 0 failed checks' },
            { title: 'ETA', content: '8 minutes remaining' },
            {
              title: 'Description',
              content: 'Use the inspector for concise sidecar context, not a full operational dashboard.',
              tone: 'muted',
            },
          ],
          width: 42,
          ctx,
        }),
      },
    ],
    source: {
      examplePath: 'examples/app-frame/main.ts',
      snippetLabel: 'Inspector side panel',
    },
    tags: ['structure', 'inspection', 'side-panel'],
  };
