import { CANONICAL_STORY_PROFILE_PRESETS } from './stories-runtime.js';
import { explorationListPreview } from './stories-helper-exploration-list-preview.js';

import type { DogfoodComponentStory } from './stories-contract.js';

export const STORY_LISTS_FOR_EXPLORATION: DogfoodComponentStory = {
    kind: 'component',
    id: 'lists-for-exploration',
    coverageFamilyIds: ['lists-for-exploration'],
    family: 'Data and browsing',
    title: 'enumeratedList() / browsableListSurface()',
    package: 'bijou-tui',
    docs: {
      summary: 'Exploration-list family for one-dimensional scanning where item order and focused inspection matter more than columns or hierarchy.',
      useWhen: [
        'The content is fundamentally a list, not a table or tree.',
        'The first distinguishing label should lead each row or item.',
        'Keyboard browsing materially helps the user inspect records or destinations.',
      ],
      avoidWhen: [
        'Columns carry the meaning; prefer `table()`.',
        'Parent-child nesting matters; prefer `tree()`.',
        'The user is executing commands rather than exploring records; prefer `commandPaletteSurface()`.',
      ],
      relatedFamilies: ['table()', 'tree()', 'commandPaletteSurface()'],
      gracefulLowering: {
        interactive: 'Browsable list rows preserve active selection and optional descriptions.',
        static: 'Ordered list snapshots remain readable without active keyboard focus.',
        pipe: 'Plain list text keeps order and labels explicit.',
        accessible: 'Selection, order, and descriptions remain explicit in linear text.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'ordered-outline',
        label: 'Ordered outline',
        description: 'A passive list is enough when the task is scan-first review.',
        render: ({ width, ctx }) => explorationListPreview({
          width,
          ctx,
          title: 'ordered outline',
          mode: 'enumerated',
        }),
      },
      {
        id: 'browsable-records',
        label: 'Browsable records',
        description: 'The TUI path adds row focus and descriptions without pretending the content is a command palette.',
        render: ({ width, ctx }) => explorationListPreview({
          width,
          ctx,
          title: 'browsable records',
          mode: 'browsable',
        }),
      },
    ],
    tags: ['list', 'browsing', 'exploration'],
  };
