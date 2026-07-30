import { CANONICAL_STORY_PROFILE_PRESETS } from './stories-runtime.js';
import { workspaceLayoutPreview } from './stories-helper-workspace-layout-preview.js';

import type { DogfoodComponentStory } from './stories-contract.js';

export const STORY_WORKSPACE_LAYOUT: DogfoodComponentStory = {
    kind: 'component',
    id: 'workspace-layout',
    coverageFamilyIds: ['workspace-layout'],
    family: 'Shell and workspace',
    title: 'splitPaneSurface() / gridSurface()',
    package: 'bijou-tui',
    docs: {
      summary: 'Workspace-layout family for honest spatial composition when simultaneous context materially helps the task and sequential flow would hide important relationships.',
      useWhen: [
        'Spatial arrangement materially helps the task.',
        'Primary and secondary regions should stay visible together.',
        'The regions already have meaningful jobs and are not just geometry for its own sake.',
      ],
      avoidWhen: [
        'A sequential flow would be simpler and more legible.',
        'The borders only expose layout math instead of region purpose.',
        'The same meaning would be clearer as one focused pane.',
      ],
      relatedFamilies: ['createFramedApp()', 'box()', 'focusAreaSurface()'],
      gracefulLowering: {
        interactive: 'Spatial relationships stay visible through split and grid composition.',
        static: 'A deterministic layout snapshot preserves region jobs without fake interactivity.',
        pipe: 'Regions lower to a sensible sequential reading order.',
        accessible: 'Labeled regions linearize predictably without losing section identity.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'split-context',
        label: 'Split context',
        description: 'A split keeps primary work and secondary context visible at once.',
        render: ({ width, ctx }) => workspaceLayoutPreview({
          width,
          ctx,
          title: 'split workspace',
          mode: 'split',
        }),
      },
      {
        id: 'dashboard-grid',
        label: 'Dashboard grid',
        description: 'A grid is honest when multiple stable regions deserve simultaneous visibility.',
        render: ({ width, ctx }) => workspaceLayoutPreview({
          width,
          ctx,
          title: 'grid workspace',
          mode: 'grid',
        }),
      },
    ],
    tags: ['layout', 'split', 'grid'],
  };
