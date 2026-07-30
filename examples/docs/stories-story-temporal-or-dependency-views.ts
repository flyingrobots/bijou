import { CANONICAL_STORY_PROFILE_PRESETS } from './stories-runtime.js';
import { temporalPreview } from './stories-helper-temporal-preview.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_TEMPORAL_OR_DEPENDENCY_VIEWS: DogfoodComponentStory = {
    kind: 'component',
    id: 'temporal-or-dependency-views',
    coverageFamilyIds: ['temporal-or-dependency-views'],
    family: 'Data and browsing',
    title: 'timeline() / dag()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Temporal and dependency family for explaining what happened next or what depends on what when order or causality is the real structure.',
      useWhen: [
        'Chronology or dependency is the actual organizing principle.',
        'The user needs to follow sequence or causal structure, not just compare rows.',
        'A summary metric alone would hide the important relationship between events or nodes.',
      ],
      avoidWhen: [
        'A plain table or tree answers the question more directly.',
        'The graph is decorative wallpaper instead of meaningful structure.',
        'The content has only one parent and is mainly consumed as sequence; a timeline or tree may be clearer than a DAG.',
      ],
      relatedFamilies: ['table()', 'tree()', 'log()'],
      gracefulLowering: {
        interactive: 'Chronological or dependency structure stays visible as the main story.',
        static: 'A deterministic frame preserves order or causal relationships honestly.',
        pipe: 'Ordered event lines or dependency traces keep the same semantic meaning in plain text.',
        accessible: 'Temporal or causal relationships remain explicit without relying on shape alone.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'release-timeline',
        label: 'Release timeline',
        description: 'Chronology is the right frame when the question is what happened next.',
        render: ({ width, ctx }) => temporalPreview({
          width,
          ctx,
          title: 'release timeline',
          mode: 'timeline',
        }),
      },
      {
        id: 'dependency-graph',
        label: 'Dependency graph',
        description: 'Dependency structure matters when readiness depends on upstream steps.',
        render: ({ width, ctx }) => temporalPreview({
          width,
          ctx,
          title: 'dependency graph',
          mode: 'dag',
        }),
      },
    ],
    tags: ['timeline', 'dag', 'dependency'],
  };
