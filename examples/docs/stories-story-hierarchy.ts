import { CANONICAL_STORY_PROFILE_PRESETS } from './stories-runtime.js';
import { hierarchyPreview } from './stories-helper-hierarchy-preview.js';

import type { DogfoodComponentStory } from './stories-contract.js';

export const STORY_HIERARCHY: DogfoodComponentStory = {
    kind: 'component',
    id: 'hierarchy',
    coverageFamilyIds: ['hierarchy'],
    family: 'Data and browsing',
    title: 'tree() / filePickerSurface()',
    package: 'bijou-tui',
    docs: {
      summary: 'Hierarchy family for parent-child structure and filesystem-style browsing where nesting, path context, and directory boundaries matter more than tabular comparison.',
      useWhen: [
        'Parent-child nesting is the mental model.',
        'Path context or directory/file distinction helps the user orient themselves.',
        'The hierarchy should still read honestly when flattened into text.',
      ],
      avoidWhen: [
        'Multiple parents or causal dependencies dominate; prefer `dag()`.',
        'The user is comparing attributes across peers; prefer `table()`.',
        'The content is really a linear list with no nesting benefit.',
      ],
      relatedFamilies: ['browsableListSurface()', 'dag()', 'filePickerSurface()'],
      gracefulLowering: {
        interactive: 'Nested structure and file-browser snapshots preserve parent-child meaning.',
        static: 'A deterministic hierarchy frame still communicates nesting and path context.',
        pipe: 'Indented textual hierarchy remains natural and honest.',
        accessible: 'Parent-child relationships stay explicit in reading order.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'project-tree',
        label: 'Project tree',
        description: 'A passive hierarchy is enough when the user is understanding shape and ownership.',
        render: ({ width, ctx }) => hierarchyPreview({
          width,
          ctx,
          title: 'project hierarchy',
          mode: 'tree',
        }),
      },
      {
        id: 'file-browser',
        label: 'File browser snapshot',
        description: 'A file-picker view adds path and directory semantics on the rich TUI path.',
        render: ({ width, ctx }) => hierarchyPreview({
          width,
          ctx,
          title: 'file picker',
          mode: 'picker',
        }),
      },
    ],
    tags: ['hierarchy', 'tree', 'filesystem'],
  };
