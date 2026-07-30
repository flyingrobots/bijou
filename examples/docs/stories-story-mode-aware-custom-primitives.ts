import { CANONICAL_STORY_PROFILE_PRESETS } from './stories-runtime.js';
import { customPrimitivePreview } from './stories-helper-custom-primitive-preview.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_MODE_AWARE_CUSTOM_PRIMITIVES: DogfoodComponentStory = {
    kind: 'component',
    id: 'mode-aware-custom-primitives',
    coverageFamilyIds: ['mode-aware-custom-primitives'],
    family: 'Branding, motion, and authoring',
    title: 'renderByMode()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Authoring seam for app-defined primitives that keep one semantic meaning while lowering honestly across interactive, pipe, and accessible modes.',
      useWhen: [
        'The app needs a domain-specific primitive that does not belong in shared Bijou componentry.',
        'The same concept must remain truthful across modes without inventing different behaviors per branch.',
        'You are authoring one semantic thing first and then describing its honest lowerings.',
      ],
      avoidWhen: [
        'A shipped Bijou family already matches the job.',
        'The branching only exists for cosmetic novelty instead of semantic truth.',
        'The accessible or pipe branch would hide meaning that the rich branch relies on.',
      ],
      relatedFamilies: ['note()', 'badge()', 'markdown()'],
      gracefulLowering: {
        interactive: 'The richest honest rendering can use styling and composition without losing the underlying semantic meaning.',
        static: 'The same authored primitive remains visible in a deterministic single frame.',
        pipe: 'The primitive lowers to explicit text instead of silent style loss.',
        accessible: 'The same semantic thing is linearized into plain language without decorative assumptions.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'deployment-spark',
        label: 'Deployment spark',
        description: 'One app-owned primitive can keep the same meaning while changing representation by mode.',
        render: ({ width, ctx }) => customPrimitivePreview({
          width,
          ctx,
          title: 'custom primitive',
        }),
      },
    ],
    tags: ['authoring', 'custom', 'lowering'],
  };
