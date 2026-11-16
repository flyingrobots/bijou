import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { CANONICAL_STORY_PROFILE_PRESETS, guidedFlow } from './stories-runtime.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';
import type { LocalizableStory } from './stories-localizable.js';
import { guidedFlowCopy } from './stories-story-guided-flow-copy.js';

type GuidedFlowStory = DogfoodComponentStory & LocalizableStory;

export function createGuidedFlowStory(localization?: LocalizationPort): GuidedFlowStory {
  const t = guidedFlowCopy(localization);
  return {
    kind: 'component',
    id: 'guided-flow',
    coverageFamilyIds: [],
    family: 'Structural grouping and inspection',
    title: 'guidedFlow()',
    package: BIJOU_STORY_PACKAGE,
    localize: createGuidedFlowStory,
    docs: {
      summary: t.summary,
      useWhen: [t.useWhen1, t.useWhen2, t.useWhen3],
      avoidWhen: [t.avoidWhen1, t.avoidWhen2, t.avoidWhen3],
      relatedFamilies: ['explainability()', 'stepper()', 'note()'],
      gracefulLowering: {
        interactive: t['lowering.interactive'],
        static: t['lowering.static'],
        pipe: t['lowering.pipe'],
        accessible: t['lowering.accessible'],
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'staging-rollout',
        label: t['variant.stagingRollout.label'],
        description: t['variant.stagingRollout.description'],
        render: ({ width, ctx }) => guidedFlow({
          title: t['preview.title'],
          label: t['preview.label'],
          summary: t['preview.summary'],
          metadata: [t['preview.meta.owner'], t['preview.meta.window']],
          steps: [
            { title: t['preview.step1.title'], detail: t['preview.step1.detail'], status: 'complete' },
            { title: t['preview.step2.title'], detail: t['preview.step2.detail'], status: 'current' },
            { title: t['preview.step3.title'], detail: t['preview.step3.detail'], status: 'pending' },
          ],
          sections: [
            { title: t['preview.section.why.title'], content: t['preview.section.why.content'] },
            { title: t['preview.section.note.title'], content: t['preview.section.note.content'], tone: 'muted' },
          ],
          nextAction: t['preview.nextAction'],
          width: Math.max(54, Math.min(width, 72)),
          ctx,
        }),
      },
    ],
    tags: ['guidance', 'workflow', 'guided-flow'],
  };
}

export const STORY_GUIDED_FLOW: GuidedFlowStory = createGuidedFlowStory();
