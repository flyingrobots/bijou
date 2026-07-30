import { CANONICAL_STORY_PROFILE_PRESETS } from './stories-runtime.js';
import { brandingPreview } from './stories-helper-branding-preview.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_EXPRESSIVE_BRANDING: DogfoodComponentStory = {
    kind: 'component',
    id: 'expressive-branding',
    coverageFamilyIds: ['expressive-branding-and-decorative-emphasis'],
    family: 'Branding, motion, and authoring',
    title: 'loadRandomLogo() / gradientText()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Expressive branding family for rare logo and gradient emphasis moments that add atmosphere without becoming routine application chrome.',
      useWhen: [
        'A splash, landing, or documentation moment benefits from deliberate brand voice or celebration.',
        'The emphasized text is non-critical and can fall back cleanly in constrained modes.',
        'The decoration opens or punctuates the experience instead of dominating everyday work.',
      ],
      avoidWhen: [
        'Critical status, navigation, or instructions depend on decorative treatment.',
        'The interface is already busy and another branded flourish would compete with the task.',
        'The same text must remain equally plain and scannable in every mode.',
      ],
      relatedFamilies: ['canvas()', 'markdown()', 'box()'],
      gracefulLowering: {
        interactive: 'Logo and gradient emphasis create atmosphere without owning the whole interface.',
        static: 'Expressive emphasis remains visible in one deterministic frame.',
        pipe: 'Plain text remains fully meaningful without pretending decorative color still exists.',
        accessible: 'Text content stays explicit and decorative output does not pollute reading order.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'launch-moment',
        label: 'Launch moment',
        description: 'Brand treatment can open a docs or splash surface, then get out of the way.',
        render: ({ width, ctx }) => brandingPreview({
          width,
          ctx,
          title: 'launch moment',
          mode: 'launch',
        }),
      },
      {
        id: 'celebratory-heading',
        label: 'Celebratory heading',
        description: 'Short gradient emphasis works best as a rare heading-level accent.',
        render: ({ width, ctx }) => brandingPreview({
          width,
          ctx,
          title: 'celebratory heading',
          mode: 'heading',
        }),
      },
    ],
    tags: ['branding', 'gradient', 'logo'],
  };
