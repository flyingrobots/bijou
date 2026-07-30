import { CANONICAL_STORY_PROFILE_PRESETS, guidedFlow } from './stories-runtime.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_GUIDED_FLOW: DogfoodComponentStory = {
    kind: 'component',
    id: 'guided-flow',
    coverageFamilyIds: [],
    family: 'Structural grouping and inspection',
    title: 'guidedFlow()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Reusable block for calmer multi-step assistance surfaces with explicit sections and one obvious next action.',
      useWhen: [
        'The flow needs one calm recommendation or setup path without becoming a full wizard.',
        'Section rhythm and the next action should stay explicit instead of dissolving into generic prose.',
        'The surface is guided assistance, but not specifically AI explainability.',
      ],
      avoidWhen: [
        'The content is AI-mediated and needs explicit provenance, evidence, or confidence; prefer `explainability()`.',
        'The user needs editable state transitions or full step-by-step routing owned by the shell.',
        'A simple note or alert would already say the whole thing honestly.',
      ],
      relatedFamilies: ['explainability()', 'stepper()', 'note()'],
      gracefulLowering: {
        interactive: 'One grouped block keeps summary, steps, sections, and next action visibly distinct.',
        static: 'The same section rhythm stays deterministic without runtime shell behavior.',
        pipe: 'Indented sections and a labeled next action preserve the path without decorative chrome.',
        accessible: 'Linearized steps and section labels preserve the same guided meaning in reading order.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'staging-rollout',
        label: 'Staging rollout',
        description: 'Calm multi-step guidance with one explicit next action.',
        render: ({ width, ctx }) => guidedFlow({
          title: 'Prepare the staging rollout',
          label: 'Setup',
          summary: 'Keep the operator on one calm path instead of scattering the sequence across notes, drawers, and status rows.',
          metadata: ['Owner: Platform ops', 'Window: Today'],
          steps: [
            { title: 'Review rollout health', detail: 'Canary latency and error budget are both healthy.', status: 'complete' },
            { title: 'Refresh the staging secret', detail: 'The existing token expires in 30 minutes.', status: 'current' },
            { title: 'Promote the rollout', detail: 'Only after the new secret is confirmed.', status: 'pending' },
          ],
          sections: [
            { title: 'Why', content: 'The rollout is healthy, but the expiring token makes the current path fragile until rotation is complete.' },
            { title: 'Operator note', content: 'Keep the guidance advisory until the rotated secret is confirmed in the deployment logs.', tone: 'muted' },
          ],
          nextAction: 'Open the staging secret manager and rotate the deployment token.',
          width: Math.max(54, Math.min(width, 72)),
          ctx,
        }),
      },
    ],
    tags: ['guidance', 'workflow', 'guided-flow'],
  };
