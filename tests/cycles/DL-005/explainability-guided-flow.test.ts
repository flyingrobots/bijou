import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';
import {
  _resetDefaultContextForTesting,
  createTestContext,
} from '../../../packages/bijou/src/adapters/test/index.js';
import {
  explainability,
  setDefaultContext,
} from '../../../packages/bijou/src/index.js';


describe('DL-005 inspector and guided-flow rhythm cycle', () => {
  beforeAll(() => setDefaultContext(createTestContext({ mode: 'interactive' })));
  afterAll(() => _resetDefaultContextForTesting());

  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = readRepoFile('docs/design/DL-005-prove-inspector-and-guided-flow-rhythm.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('marks AI visibly and separates rationale, evidence, and next action in the guided-flow surface', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const rendered = explainability({
      title: 'Recommend a calmer first-run shell flow',
      artifactKind: 'Suggestion',
      source: 'design-review-agent',
      rationale: 'The current shell spreads first-run guidance across panes and drawers.',
      evidence: [
        { label: 'Users cannot tell which pane owns input.' },
        { label: 'Settings copy competes with primary action labels.' },
      ],
      nextAction: 'Promote the first-run walkthrough into a canonical guided-flow block.',
      governance: 'Human review is required before enabling this flow by default.',
      confidence: 0.82,
      ctx,
    });

    const lines = rendered.split('\n');
    const whyIndex = lines.findIndex((line) => line === 'Why:');
    const evidenceIndex = lines.findIndex((line) => line === 'Evidence:');
    const nextIndex = lines.findIndex((line) => line === 'Next action:');

    expect(rendered).toContain('[AI] Recommend a calmer first-run shell flow');
    expect(whyIndex).toBeGreaterThan(0);
    expect(evidenceIndex).toBeGreaterThan(whyIndex + 1);
    expect(nextIndex).toBeGreaterThan(evidenceIndex + 2);
    expect(rendered).toContain('1. Users cannot tell which pane owns input.');
    expect(rendered).toContain('2. Settings copy competes with primary action labels.');
    expect(rendered).toContain('Human review is required before enabling this flow by default.');
  });

  it('preserves explainability meaning in accessible mode without relying on visual chrome', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const rendered = explainability({
      title: 'Recommend a calmer first-run shell flow',
      artifactKind: 'Suggestion',
      source: 'design-review-agent',
      rationale: 'The current shell spreads first-run guidance across panes and drawers.',
      evidence: [
        { label: 'Users cannot tell which pane owns input.' },
      ],
      nextAction: 'Promote the first-run walkthrough into a canonical guided-flow block.',
      confidence: 0.82,
      ctx,
    });

    expect(rendered).toContain('AI explanation: Recommend a calmer first-run shell flow');
    expect(rendered).toContain('Artifact kind: Suggestion');
    expect(rendered).toContain('Source: design-review-agent');
    expect(rendered).toContain('Confidence: 82%');
    expect(rendered).toContain('Why: The current shell spreads first-run guidance across panes and drawers.');
    expect(rendered).toContain('Evidence:');
    expect(rendered).toContain('1. Users cannot tell which pane owns input.');
    expect(rendered).toContain('Next action: Promote the first-run walkthrough into a canonical guided-flow block.');
  });

  it('spawns the next design-language backlog item', () => {
    const cycle = readRepoFile('docs/design/DL-005-prove-inspector-and-guided-flow-rhythm.md');

    expect(cycle).toContain('[DL-006 — Prove Inspector Panel Rhythm]');
    expect(
      existsRepoPath('docs/BACKLOG/DL-006-prove-inspector-panel-rhythm.md') ||
      existsRepoPath('docs/design/DL-006-prove-inspector-panel-rhythm.md'),
    ).toBe(true);
  });
});
