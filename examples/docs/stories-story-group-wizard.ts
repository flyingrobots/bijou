import { CANONICAL_STORY_PROFILE_PRESETS } from './stories-runtime.js';
import { stagedFormPreview } from './stories-helper-staged-form-preview.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_GROUP_WIZARD: DogfoodComponentStory = {
    kind: 'component',
    id: 'group-wizard',
    coverageFamilyIds: ['multi-field-and-staged-forms'],
    family: 'Decision and selection forms',
    title: 'group() / wizard()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Grouped and staged form family for related inputs that belong together, whether they happen in one focused section or across explicit steps.',
      useWhen: [
        'Several related fields need one shared goal instead of feeling like disconnected prompts.',
        'A grouped form (`group()`) or staged flow (`wizard()`) should keep progress and summary language explicit.',
        'The result needs more structure than one choice or one text field can provide honestly.',
      ],
      avoidWhen: [
        'Only one binary or one-choice decision is being made; prefer `confirm()` or `select()`.',
        'The fields are unrelated and should not be bundled into one form narrative.',
        'The content is really documentation, explanation, or inspection rather than data collection.',
      ],
      relatedFamilies: ['input()', 'textarea()', 'select()', 'confirm()'],
      gracefulLowering: {
        interactive: 'Grouped or staged form panels preserve field rhythm, current step, and summary cues without pretending the flow is just one big text prompt.',
        static: 'Deterministic snapshots keep the current group or wizard step explicit for docs and screenshots.',
        pipe: 'Sequential textual prompts preserve grouping and step intent instead of flattening unrelated fields together.',
        accessible: 'Field labels, step names, and progress stay explicit in linear reading order.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'deploy-group',
        label: 'Deploy group',
        description: 'One grouped deployment form keeps related fields together without inventing fake steps.',
        render: ({ width, ctx }) => stagedFormPreview({
          width,
          ctx,
          title: 'Prepare a production deploy:',
          mode: 'group',
          fields: [
            { label: 'Environment', value: 'production' },
            { label: 'Window', value: 'Tonight, 17:00-18:00 PDT' },
            { label: 'Approver', value: 'Release manager on call' },
          ],
          summaryText: 'Use grouped forms when the user is filling out one coherent packet of related fields.',
        }),
      },
      {
        id: 'rollout-wizard',
        label: 'Rollout wizard',
        description: 'A staged flow keeps the current step and remaining work explicit instead of dumping every field at once.',
        render: ({ width, ctx }) => stagedFormPreview({
          width,
          ctx,
          title: 'Plan the rollout:',
          mode: 'wizard',
          stepLabel: 'Step 2 of 3 • Verification',
          fields: [
            { label: 'Health threshold', value: '0 failed probes for 10m' },
            { label: 'Fallback owner', value: 'platform-ops' },
          ],
          summaryText: 'Use staged forms when progress and step boundaries matter more than one giant grouped panel.',
        }),
      },
    ],
    tags: ['forms', 'wizard', 'group'],
  };
