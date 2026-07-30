import { CANONICAL_STORY_PROFILE_PRESETS, box, hyperlink } from './stories-runtime.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_HYPERLINK: DogfoodComponentStory = {
    kind: 'component',
    id: 'hyperlink',
    coverageFamilyIds: ['linked-destinations'],
    family: 'Documents and references',
    title: 'hyperlink()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Explicit destination primitive for links that should remain meaningful whether or not the terminal supports clickable OSC 8 output.',
      useWhen: [
        'The destination matters and should remain part of the rendered output.',
        'Supporting terminals should get clickability without hiding the destination semantics.',
        'Fallback behavior needs to stay intentional in pipe or accessible modes.',
      ],
      avoidWhen: [
        'The destination is ambiguous or should not be activated casually.',
        'The label is generic and hides the real meaning or trust context.',
        'The user needs an app-owned action rather than an external destination.',
      ],
      relatedFamilies: ['markdown()', 'note()', 'helpView()'],
      gracefulLowering: {
        interactive: 'Meaningful visible link text remains present while supporting terminals get OSC 8 clickability.',
        static: 'Deterministic link text still preserves the same explicit destination semantics.',
        pipe: 'Fallback modes keep the destination or label explicit in plain text.',
        accessible: 'Label and destination remain clear in reading order without assuming clickability.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'explicit-destinations',
        label: 'Explicit destinations',
        description: 'Link labels describe the destination instead of hiding it behind generic action copy.',
        render: ({ ctx }) => box([
          `Repository: ${hyperlink('flyingrobots/bijou', 'https://github.com/flyingrobots/bijou', { ctx })}`,
          '',
          `API docs: ${hyperlink('README reference', 'https://github.com/flyingrobots/bijou#readme', { ctx })}`,
        ].join('\n'), {
          title: 'linked destinations',
          width: 58,
          ctx,
        }),
      },
      {
        id: 'fallback-modes',
        label: 'Fallback modes',
        description: 'Fallback formatting remains an explicit product choice when clickable links are unavailable.',
        render: ({ ctx }) => box([
          `Both: ${hyperlink('Release notes', 'https://example.com/release-notes', { fallback: 'both', ctx })}`,
          '',
          `URL only: ${hyperlink('API reference', 'https://example.com/api', { fallback: 'url', ctx })}`,
          '',
          `Text only: ${hyperlink('Trusted local handbook', 'https://example.com/handbook', { fallback: 'text', ctx })}`,
        ].join('\n'), {
          title: 'fallback policy',
          width: 62,
          ctx,
        }),
      },
    ],
    tags: ['docs', 'links', 'destinations'],
  };
