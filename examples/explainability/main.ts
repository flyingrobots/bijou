import { ctx } from '../_shared/setup.js';
import { explainability, separator } from '@flyingrobots/bijou';

console.log(separator({ label: 'explainability example', ctx }));
console.log();
console.log(explainability({
  title: 'Promote the canary build',
  artifactKind: 'Recommendation',
  source: 'Release advisor',
  sourceMode: 'Advisory draft',
  rationale: 'Traffic and error budgets have stayed healthy long enough to make promotion the next reviewable step.',
  evidence: [
    { label: 'Error rate', detail: '0.02% for the last 15 minutes' },
    { label: 'Latency', detail: 'p95 stayed below 110ms in both canary regions' },
    { label: 'Capacity', detail: 'queue depth remained under 12 during peak traffic' },
  ],
  nextAction: 'Promote the canary ring to the full production rollout after human review.',
  governance: 'A release owner must confirm the recommendation before production promotion.',
  confidence: 0.86,
  width: 68,
  ctx,
}));
