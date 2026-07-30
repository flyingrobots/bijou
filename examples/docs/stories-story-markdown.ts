import { CANONICAL_STORY_PROFILE_PRESETS, MARKDOWN_RELEASE_NOTES, box, markdown } from './stories-runtime.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_MARKDOWN: DogfoodComponentStory = {
    kind: 'component',
    id: 'markdown',
    coverageFamilyIds: ['formatted-documents-and-prose'],
    family: 'Documents and references',
    title: 'markdown()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Bounded structured prose renderer for help, release notes, and reference text that should stay honest across rich, pipe, and accessible modes.',
      useWhen: [
        'Help, reference, or release-note prose needs lightweight structure without becoming a whole document reader.',
        'The same content should remain understandable in interactive, static, pipe, and accessible modes.',
        'Headings, lists, links, or short quotes materially improve scannability.',
      ],
      avoidWhen: [
        'The app is really composing interface chrome, forms, or layout rather than prose.',
        'The content needs deep navigation instead of one bounded rendered block.',
        'Browser-grade markdown fidelity or arbitrary user-authored documents are expected.',
      ],
      relatedFamilies: ['hyperlink()', 'box()', 'pager()'],
      gracefulLowering: {
        interactive: 'Bounded structured prose keeps headings, emphasis, lists, and links readable within terminal constraints.',
        static: 'Single deterministic document block preserves the same structure without live interaction.',
        pipe: 'Plain text keeps heading/list/code semantics understandable without styling.',
        accessible: 'Headings, lists, links, and code cues stay explicit in reading order.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'release-note',
        label: 'Release note',
        description: 'A bounded markdown document that behaves like reference prose instead of layout chrome.',
        render: ({ ctx }) => box(markdown(MARKDOWN_RELEASE_NOTES, { width: 42, ctx }), {
          title: 'release note',
          width: 50,
          ctx,
        }),
      },
      {
        id: 'help-excerpt',
        label: 'Help excerpt',
        description: 'Short structured help text stays scannable without becoming a full document browser.',
        render: ({ ctx }) => box(markdown([
          '## Quick start',
          '',
          '1. Open the command palette.',
          '2. Search for a component family.',
          '3. Read the usage notes before choosing a surface.',
          '',
          'Use [`hyperlink()`](https://github.com/flyingrobots/bijou) when the destination itself matters.',
        ].join('\n'), { width: 42, ctx }), {
          title: 'help excerpt',
          width: 50,
          ctx,
        }),
      },
    ],
    tags: ['docs', 'prose', 'reference'],
  };
