import { CANONICAL_STORY_PROFILE_PRESETS, confirmPreview } from './stories-runtime.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_CONFIRM: DogfoodComponentStory = {
    kind: 'component',
    id: 'confirm',
    coverageFamilyIds: ['binary-decision'],
    family: 'Decision and selection forms',
    title: 'confirm()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Binary decision prompt for real yes/no choices where the consequence of accepting or declining should stay explicit.',
      useWhen: [
        'The user is making a genuine yes/no decision and both outcomes are easy to explain plainly.',
        'A destructive or consequential action needs one explicit final checkpoint.',
        'The prompt can stay short while still naming what yes and no actually do.',
      ],
      avoidWhen: [
        'The user really needs to compare more than two outcomes.',
        'The prompt is vague enough that yes or no would be ambiguous.',
        'The choice belongs inside a longer staged flow with more context; prefer `wizard()` or `group()` there.',
      ],
      relatedFamilies: ['modal()', 'alert()', 'wizard()'],
      gracefulLowering: {
        interactive: 'Focused yes/no prompt with an explicit default and natural keyboard confirmation.',
        static: 'Deterministic prompt snapshot that keeps the question and default state honest.',
        pipe: 'Plain textual yes/no prompt with the default orientation preserved.',
        accessible: 'Explicit binary question plus default state in plain language.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'deploy-gate',
        label: 'Deploy gate',
        description: 'Default-no confirmation for a consequential production action.',
        render: ({ width, ctx }) => confirmPreview({
          width,
          ctx,
          question: 'Deploy to production?',
          defaultValue: false,
          yesMeaning: 'Promote the canary and begin the production rollout.',
          noMeaning: 'Keep the rollout paused for review.',
        }),
      },
      {
        id: 'discard-draft',
        label: 'Discard draft',
        description: 'A destructive decision still needs both outcomes named explicitly.',
        render: ({ width, ctx }) => confirmPreview({
          width,
          ctx,
          question: 'Discard unsaved release notes?',
          defaultValue: false,
          yesMeaning: 'Drop the local draft and close the editor.',
          noMeaning: 'Return to editing and keep the draft open.',
        }),
      },
    ],
    tags: ['forms', 'decision', 'confirmation'],
  };
