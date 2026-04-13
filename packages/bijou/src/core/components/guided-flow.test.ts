import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { guidedFlow } from './guided-flow.js';

describe('guidedFlow', () => {
  it('renders a boxed guided-flow block in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const rendered = guidedFlow({
      title: 'Prepare the staging rollout',
      label: 'Setup',
      summary: 'Keep the operator on one calm path instead of scattering instructions across notes and drawers.',
      metadata: ['Owner: Platform ops', 'Window: Today'],
      steps: [
        { title: 'Review rollout health', detail: 'Canary latency and error budget are both healthy.', status: 'complete' },
        { title: 'Refresh the staging secret', detail: 'The previous token expires in 30 minutes.', status: 'current' },
        { title: 'Promote the rollout', detail: 'Only after the new secret is confirmed.', status: 'pending' },
      ],
      sections: [
        { title: 'Why', content: 'One reusable guided-flow block should standardize calmer review and action rhythm.' },
        { title: 'Operator note', content: 'Keep the recommendation advisory until the secret rotation is verified.', tone: 'muted' },
      ],
      nextAction: 'Open the staging secret manager and rotate the deployment token.',
      width: 64,
      ctx,
    });

    expect(rendered).toContain('Setup');
    expect(rendered).toContain('Prepare the staging rollout');
    expect(rendered).toContain('Steps');
    expect(rendered).toContain('Next action');
    expect(rendered).toContain('Operator note');
    expect(rendered).toContain('┌');
    expect(rendered).toContain('┘');
  });

  it('preserves steps and next action in accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const rendered = guidedFlow({
      title: 'Prepare the staging rollout',
      label: 'Setup',
      steps: [
        { title: 'Review rollout health', status: 'complete' },
        { title: 'Refresh the staging secret', status: 'current' },
      ],
      sections: [
        { title: 'Why', content: 'The token is close to expiry and should be rotated before promotion.' },
      ],
      nextAction: 'Rotate the token and confirm the rollout canary remains healthy.',
      ctx,
    });

    expect(rendered).toContain('Guided flow: Prepare the staging rollout');
    expect(rendered).toContain('Label: Setup');
    expect(rendered).toContain('Steps:');
    expect(rendered).toContain('1. Done: Review rollout health');
    expect(rendered).toContain('2. Now: Refresh the staging secret');
    expect(rendered).toContain('Why: The token is close to expiry and should be rotated before promotion.');
    expect(rendered).toContain('Next action: Rotate the token and confirm the rollout canary remains healthy.');
  });
});
