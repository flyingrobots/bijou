import { CANONICAL_STORY_PROFILE_PRESETS } from './stories-runtime.js';
import { textEntryPreview } from './stories-helper-text-entry-preview.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_TEXT_ENTRY: DogfoodComponentStory = {
    kind: 'component',
    id: 'text-entry',
    coverageFamilyIds: ['text-entry'],
    family: 'Decision and selection forms',
    title: 'input() / textarea()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Text-entry family for collecting freeform user input, from short single-line identifiers to longer multiline notes that still need honest lowering.',
      useWhen: [
        'The user is providing text rather than choosing from a fixed set of options.',
        'A short field (`input()`) or a longer multiline editor (`textarea()`) is the real job, not just supporting metadata.',
        'Prompt, current value, and validation state should remain truthful in rich, pipe, and accessible modes.',
      ],
      avoidWhen: [
        'The options are already enumerable; prefer `select()` or `multiselect()`.',
        'The user is progressing through several related inputs as one staged task; prefer `group()` or `wizard()`.',
        'The content is only a passive note or status and does not require user text entry.',
      ],
      relatedFamilies: ['select()', 'filter()', 'group()', 'wizard()'],
      gracefulLowering: {
        interactive: 'Focused field or editor treatment keeps prompt, current value, and validation visible without pretending text entry is just static prose.',
        static: 'Single deterministic snapshot of the current value or prompt state remains honest about what the field is collecting.',
        pipe: 'Line-buffered textual prompts keep the label, value, and validation explicit in plain text.',
        accessible: 'Prompt, entry type, current value, and validation cues remain explicit in one readable linear flow.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'service-name',
        label: 'Service name',
        description: 'Single-line entry for a stable identifier with clear constraints and current value.',
        render: ({ width, ctx }) => textEntryPreview({
          width,
          ctx,
          title: 'Choose a package slug:',
          label: 'Package name',
          value: 'release-control',
          helperText: 'Used in URLs, artifacts, and release announcements.',
          validationText: 'Use lowercase kebab-case.',
        }),
      },
      {
        id: 'incident-summary',
        label: 'Incident summary',
        description: 'Multiline entry for operator notes and context that would not fit honestly in one short field.',
        render: ({ width, ctx }) => textEntryPreview({
          width,
          ctx,
          title: 'Write a rollout summary:',
          label: 'Summary',
          value: [
            'Canary passed in eu-west after one retry.',
            'Hold promotion until the background queue drains.',
          ].join('\n'),
          helperText: 'Use multiline entry when the note itself matters, not just the final status.',
          multiline: true,
        }),
      },
    ],
    tags: ['forms', 'input', 'text'],
  };
