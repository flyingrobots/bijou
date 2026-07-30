import { CANONICAL_STORY_PROFILE_PRESETS, box, boxSurface, headerBox, row, spacer } from './stories-runtime.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_BOX: DogfoodComponentStory = {
    kind: 'component',
    id: 'box',
    coverageFamilyIds: ['framed-grouping'],
    family: 'Structural grouping and inspection',
    title: 'box()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Canonical containment primitive for grouped content and compact titled panels, with `headerBox()` and surface companions for richer layout composition.',
      useWhen: [
        'A region needs visible containment so sibling working areas read as distinct jobs.',
        'A compact titled panel needs terse supporting detail such as scope, version, or environment.',
        'Grouping helps comprehension more honestly than another heading or paragraph break alone.',
      ],
      avoidWhen: [
        'The border would only add decoration and not communicate real containment.',
        'Urgency or interruption is the primary job; prefer `alert()` or `modal()`.',
        'Whitespace, a separator, or a simple heading would already explain the structure clearly.',
      ],
      relatedFamilies: ['separator()', 'alert()', 'inspector()'],
      gracefulLowering: {
        interactive: 'Bordered or titled containment stays visible so grouped regions remain distinct working areas.',
        static: 'Single deterministic grouped panels preserve the same containment and title/detail cues.',
        pipe: 'Plain grouped text with spacing and optional titles instead of decorative borders.',
        accessible: 'Preserve title and content order without depending on borders or color.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'header-detail',
        label: 'Header detail',
        description: 'Compact titled grouping with terse metadata instead of a full explanatory sentence.',
        render: ({ ctx }) => [
          headerBox('Deploy', { detail: 'v4.0.0 → production', ctx }),
          '',
          box('Window\n\n- freeze at 17:00\n- canaries at 17:15\n- promote after verification', {
            title: 'release window',
            width: 38,
            ctx,
          }),
        ].join('\n'),
      },
      {
        id: 'peer-panels',
        label: 'Peer panels',
        description: 'Contained sibling regions that read as separate work areas instead of one blended block.',
        render: ({ ctx }) => row([
          boxSurface('Signals\n\n- latency\n- throughput\n- queue depth', {
            title: 'ops',
            width: 20,
            ctx,
          }),
          spacer(2),
          boxSurface('Actions\n\n- confirm deploy\n- watch canaries\n- page owner', {
            title: 'release',
            width: 22,
            ctx,
          }),
        ]),
      },
    ],
    tags: ['structure', 'grouping', 'panels'],
  };
