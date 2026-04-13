import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../../packages/bijou/src/adapters/test/index.js';
import { explainability, guidedFlow } from '../../../packages/bijou/src/index.js';
import { existsRepoPath, readRepoFile } from '../repo.js';

describe('DL-008 guided-flow block cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = readRepoFile('docs/design/DL-008-promote-guided-flow-block.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('renders a calmer guided-flow block with steps and one explicit next action', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const rendered = guidedFlow({
      title: 'Prepare the staging rollout',
      label: 'Setup',
      summary: 'Keep the operator on one calm path instead of scattering the sequence across notes and drawers.',
      steps: [
        { title: 'Review rollout health', status: 'complete' },
        { title: 'Refresh the staging secret', status: 'current' },
        { title: 'Promote the rollout', status: 'pending' },
      ],
      sections: [
        { title: 'Why', content: 'The rollout is healthy, but the expiring token makes the current path fragile until rotation is complete.' },
      ],
      nextAction: 'Open the staging secret manager and rotate the deployment token.',
      width: 64,
      ctx,
    });

    expect(rendered).toContain('Setup');
    expect(rendered).toContain('Prepare the staging rollout');
    expect(rendered).toContain('Steps');
    expect(rendered).toContain('Next action');
    expect(rendered).toContain('Open the staging secret manager');
    expect(rendered).toContain('token.');
  });

  it('keeps explainability as the AI-specific guided-flow specialization', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const rendered = explainability({
      title: 'Promote the canary build',
      artifactKind: 'Recommendation',
      rationale: 'Traffic and error budgets stayed healthy long enough to make promotion reviewable.',
      evidence: [{ label: 'Latency', detail: 'p95 stayed below 110ms in both canary regions' }],
      nextAction: 'Promote the canary ring after human review.',
      governance: 'A release owner must confirm the recommendation before production promotion.',
      confidence: 0.86,
      ctx,
    });

    expect(rendered).toContain('AI explanation: Promote the canary build');
    expect(rendered).toContain('Evidence:');
    expect(rendered).toContain('Latency — p95 stayed below 110ms in both canary regions');
    expect(rendered).toContain('Next action: Promote the canary ring after human review.');
    expect(rendered).toContain('Governance: A release owner must confirm the recommendation before production promotion.');
  });

  it('proves the promoted block in DOGFOOD', () => {
    const stories = readRepoFile('examples/docs/stories.ts');

    expect(stories).toContain("id: 'guided-flow'");
    expect(stories).toContain('guidedFlow({');
    expect(stories).toContain('Prepare the staging rollout');
  });

  it('points to the next design-language backlog item', () => {
    expect(existsRepoPath('docs/BACKLOG/v5.0.0/DL-009-formalize-layout-and-viewport-rules.md')).toBe(true);
  });
});
