import { CANONICAL_STORY_PROFILE_PRESETS, filterPreview, selectPreview } from './stories-runtime.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_SELECT: DogfoodComponentStory = {
    kind: 'component',
    id: 'select',
    coverageFamilyIds: ['single-choice'],
    family: 'Decision and selection forms',
    title: 'select() / filter()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Single-choice prompt family for choosing one lasting value, either from a visible list or from a searchable narrowed list.',
      useWhen: [
        'The user is choosing exactly one durable value from a known set of options.',
        'The options can either fit as a visible list (`select()`) or benefit from search narrowing (`filter()`).',
        'The flow should lower honestly to numbered or text-search prompts outside rich mode.',
      ],
      avoidWhen: [
        'The user needs to keep several options at once; prefer `multiselect()`.',
        'The rows are commands or tabs rather than one chosen value.',
        'The flow needs grouped validation or staged progression; prefer `group()` or `wizard()`.',
      ],
      relatedFamilies: ['multiselect()', 'confirm()', 'tabs()'],
      gracefulLowering: {
        interactive: 'Focused list or filter prompt that keeps one obvious current choice and supports natural keyboard confirmation.',
        static: 'Deterministic snapshot of the current choice set or narrowed search results.',
        pipe: 'Numbered or text-search prompt that still resolves to one final value explicitly.',
        accessible: 'Plain-language options that name the selected value and search query directly.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'release-policy',
        label: 'Release policy',
        description: 'Visible single-choice list where the whole decision set fits on screen without search.',
        render: ({ width, ctx }) => selectPreview({
          width,
          ctx,
          title: 'Choose a release policy:',
          options: [
            { label: 'Canary only', description: 'ship to 10% and stop' },
            { label: 'Auto promote', description: 'promote once checks pass' },
            { label: 'Hold for review', description: 'require manual approval' },
            { label: 'Abort', description: 'cancel the rollout' },
          ],
          selectedIndex: 1,
          focusedIndex: 1,
        }),
      },
      {
        id: 'runtime-search',
        label: 'Searchable runtime',
        description: 'Search narrows a larger single-choice list without changing the one-value contract.',
        render: ({ width, ctx }) => filterPreview({
          width,
          ctx,
          title: 'Choose a programming language:',
          query: 'ty',
          options: [
            { label: 'TypeScript', description: 'typed JavaScript for apps', keywords: ['javascript', 'typed', 'web'] },
            { label: 'Python', description: 'scripting and data work', keywords: ['scripting', 'ml', 'data'] },
            { label: 'OCaml', description: 'typed ML family runtime', keywords: ['functional', 'ml', 'typed'] },
            { label: 'Rust', description: 'systems safety and speed', keywords: ['systems', 'memory', 'safe'] },
          ],
          matchedIndices: [0, 1, 2],
          selectedIndex: 0,
        }),
      },
    ],
    tags: ['forms', 'selection', 'search'],
  };
