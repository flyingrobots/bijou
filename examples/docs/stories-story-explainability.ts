import { CANONICAL_STORY_PROFILE_PRESETS, explainability } from './stories-runtime.js';

import { BIJOU_STORY_PACKAGE, type DogfoodComponentStory } from './stories-contract.js';

export const STORY_EXPLAINABILITY: DogfoodComponentStory = {
    kind: 'component',
    id: 'explainability',
    coverageFamilyIds: ['explainability-walkthroughs'],
    family: 'Structural grouping and inspection',
    title: 'explainability()',
    package: BIJOU_STORY_PACKAGE,
    docs: {
      summary: 'Calm guided recommendation surface for AI-mediated or machine-assisted output that must make provenance, evidence, and next action explicit.',
      useWhen: [
        'A recommendation needs visible provenance and a clear next action instead of a vague summary card.',
        'Rationale and supporting evidence need to stay distinct from the recommendation itself.',
        'The app needs one honest explainability surface rather than a whole wizard or inspector.',
      ],
      avoidWhen: [
        'The content is just a generic note or status with no evidence-backed recommendation.',
        'The user needs a non-AI guided flow or editable review workspace; prefer `guidedFlow()` for the calmer general case.',
        'The surface would be used to hide uncertainty behind authoritative-looking chrome.',
      ],
      relatedFamilies: ['guidedFlow()', 'inspector()', 'note()', 'alert()'],
      gracefulLowering: {
        interactive: 'One calm grouped surface keeps provenance, rationale, evidence, and next action visibly distinct.',
        static: 'Single deterministic explainability card preserves the same section rhythm.',
        pipe: 'Labeled text sections keep the recommendation and evidence honest without decorative chrome.',
        accessible: 'Plain linear explanation preserves provenance, evidence, and next action explicitly in reading order.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'rollout-recommendation',
        label: 'Rollout recommendation',
        description: 'Guided recommendation with visible evidence and one clear next action.',
        render: ({ width, ctx }) => explainability({
          title: 'Promote the canary build',
          artifactKind: 'Recommendation',
          source: 'Release advisor',
          sourceMode: 'Advisory draft',
          rationale: 'Traffic and error budgets have stayed healthy long enough to make the canary promotion a reviewable next step.',
          evidence: [
            { label: 'Error rate', detail: '0.02% across the last 15 minutes' },
            { label: 'Latency', detail: 'p95 stayed below 110ms in both canary regions' },
            { label: 'Capacity', detail: 'queue depth remained under 12 during peak traffic' },
          ],
          nextAction: 'Promote the canary ring to the full production rollout after human review.',
          governance: 'A release owner must confirm the recommendation before production promotion.',
          confidence: 0.86,
          width: Math.max(54, Math.min(width, 72)),
          ctx,
        }),
      },
      {
        id: 'rollback-brief',
        label: 'Rollback brief',
        description: 'Explainability can recommend caution just as clearly as promotion.',
        render: ({ width, ctx }) => explainability({
          title: 'Hold the rollout for another review pass',
          artifactKind: 'Review brief',
          source: 'Incident assistant',
          sourceMode: 'Human-in-the-loop',
          rationale: 'The rollout is mostly healthy, but one region still shows elevated latency that could turn the recommendation premature.',
          evidence: [
            { label: 'eu-west latency', detail: 'p95 is 27ms above the baseline window' },
            { label: 'Error budget', detail: 'still healthy, but trending upward for two intervals' },
          ],
          nextAction: 'Keep the rollout paused and inspect the eu-west cache warmup path.',
          governance: 'Treat this as advisory guidance, not an automatic rollback trigger.',
          confidence: 71,
          width: Math.max(54, Math.min(width, 72)),
          ctx,
        }),
      },
    ],
    tags: ['guidance', 'ai', 'explainability'],
  };
