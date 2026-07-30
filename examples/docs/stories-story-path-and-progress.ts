import { CANONICAL_STORY_PROFILE_PRESETS } from './stories-runtime.js';
import { pathAndProgressPreview } from './stories-helper-path-and-progress-preview.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_PATH_AND_PROGRESS: DogfoodComponentStory = {
    kind: 'component',
    id: 'path-and-progress',
    coverageFamilyIds: ['path-and-progress'],
    family: 'Navigation and organization',
    title: 'breadcrumb() / stepper() / paginator()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Wayfinding and progress family for showing where the user is, what stage they are in, or how far through a sequence they have moved.',
      useWhen: [
        'The interface needs explicit location, stage, or page-progress context.',
        'A compact path or step summary helps review, recovery, or coordination.',
        'The user should understand current position without opening another navigation surface.',
      ],
      avoidWhen: [
        'Peer switching is the main job; prefer `tabs()`.',
        'The path is decorative and does not materially orient the user.',
        'Dense explanatory prose is doing the work instead of clear path labels.',
      ],
      relatedFamilies: ['tabs()', 'wizard()', 'statusBarSurface()'],
      gracefulLowering: {
        interactive: 'Visible path, stage, or page state stays compact and scannable.',
        static: 'Single-frame wayfinding and progress snapshots preserve current-state meaning.',
        pipe: 'Plain path and step summaries remain readable without styling.',
        accessible: 'Current location, order, and active stage are stated explicitly in text.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'wayfinding',
        label: 'Wayfinding',
        description: 'Breadcrumbs and pagination keep location and scale explicit.',
        render: ({ width, ctx }) => pathAndProgressPreview({
          width,
          ctx,
          title: 'wayfinding',
          mode: 'wayfinding',
        }),
      },
      {
        id: 'rollout-steps',
        label: 'Rollout steps',
        description: 'A stepper clarifies staged progress when the current stage matters more than peer switching.',
        render: ({ width, ctx }) => pathAndProgressPreview({
          width,
          ctx,
          title: 'rollout path',
          mode: 'rollout',
        }),
      },
    ],
    tags: ['wayfinding', 'progress', 'navigation'],
  };
