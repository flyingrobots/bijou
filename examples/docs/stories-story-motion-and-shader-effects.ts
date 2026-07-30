import { CANONICAL_STORY_PROFILE_PRESETS } from './stories-runtime.js';
import { motionPreview } from './stories-helper-motion-preview.js';

import type { DogfoodComponentStory } from './stories-contract.js';

export const STORY_MOTION_AND_SHADER_EFFECTS: DogfoodComponentStory = {
    kind: 'component',
    id: 'motion-and-shader-effects',
    coverageFamilyIds: ['motion-and-shader-effects'],
    family: 'Branding, motion, and authoring',
    title: 'canvas()',
    package: 'bijou-tui',
    docs: {
      summary: 'Motion and shader family for deliberate visual emphasis, transitions, and animated atmosphere when the effect reinforces state change or product voice instead of competing with the task.',
      useWhen: [
        'Motion or shader output materially clarifies a transition, state change, or atmosphere.',
        'The effect has an honest reduced-motion or static fallback.',
        'The visual moment is deliberate and bounded instead of routine chrome noise.',
      ],
      avoidWhen: [
        'The effect is only decorative and distracts from the task.',
        'Readability or scanning would be harmed by the animation.',
        'A stable status cue would communicate the meaning more directly.',
      ],
      relatedFamilies: ['animate()', 'timeline()', 'transition shaders', 'raytrace helpers'],
      gracefulLowering: {
        interactive: 'Shader-driven or animated surfaces reinforce state change or atmosphere deliberately.',
        static: 'The final visual state remains truthful without pretending motion still exists.',
        pipe: 'Decorative effects disappear and the meaning-bearing content remains.',
        accessible: 'State-change meaning stays explicit without requiring visual motion.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'shader-wave',
        label: 'Shader wave',
        description: 'A low-key animated field can reinforce atmosphere when it stays subordinate to the content.',
        render: ({ width, ctx, timeMs }) => motionPreview({
          width,
          ctx,
          title: 'shader wave',
          mode: 'wave',
          timeMs,
        }),
      },
      {
        id: 'braille-field',
        label: 'Braille field',
        description: 'Higher-resolution shader output still needs an honest non-motion fallback.',
        render: ({ width, ctx, timeMs }) => motionPreview({
          width,
          ctx,
          title: 'braille field',
          mode: 'braille',
          timeMs,
        }),
      },
      {
        id: 'glyph-raytrace',
        label: 'Glyph raytrace',
        description: 'Glyph-fit resolution can carry app-authored raytraced geometry without forcing Braille.',
        render: ({ width, ctx, timeMs }) => motionPreview({
          width,
          ctx,
          title: 'glyph raytrace',
          mode: 'glyph-raytrace',
          timeMs,
        }),
      },
      {
        id: 'spring-timeline',
        label: 'Spring timeline',
        description: 'Spring motion and timeline orchestration should be inspectable as one deterministic frame.',
        render: ({ width, ctx, timeMs }) => motionPreview({
          width,
          ctx,
          title: 'spring timeline',
          mode: 'spring-timeline',
          timeMs,
        }),
      },
    ],
    source: {
      examplePath: 'examples/transitions/main.ts',
      snippetLabel: 'Transition shader playground',
    },
    tags: ['motion', 'shader', 'canvas'],
  };
