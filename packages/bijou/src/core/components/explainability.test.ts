import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { explainability } from './explainability.js';

describe('explainability', () => {
  it('renders a boxed explainability surface in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
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
      width: 56,
      ctx,
    });

    expect(rendered).toContain('┌');
    expect(rendered).toContain('┘');
    expect(rendered).toContain('[AI]');
    expect(rendered).toContain('Why');
    expect(rendered).toContain('Evidence');
    expect(rendered).toContain('Next action');
    expect(rendered).toContain('Governance');
  });

  it('formats confidence numbers as percentages', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const rendered = explainability({
      title: 'Recommend a calmer first-run shell flow',
      confidence: 0.82,
      ctx,
    });

    expect(rendered).toContain('Confidence: 82%');
  });

  it('omits empty sections instead of rendering empty headings', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const rendered = explainability({
      title: 'Recommend a calmer first-run shell flow',
      ctx,
    });

    expect(rendered).not.toContain('Why:');
    expect(rendered).not.toContain('Evidence:');
    expect(rendered).not.toContain('Next action:');
    expect(rendered).not.toContain('Governance:');
  });

  it('renders structured accessible output', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const rendered = explainability({
      title: 'Recommend a calmer first-run shell flow',
      artifactKind: 'Suggestion',
      source: 'design-review-agent',
      rationale: 'The current shell spreads first-run guidance across panes and drawers.',
      evidence: [{ label: 'Users cannot tell which pane owns input.' }],
      nextAction: 'Promote the first-run walkthrough into a canonical guided-flow block.',
      ctx,
    });

    expect(rendered).toContain('AI explanation: Recommend a calmer first-run shell flow');
    expect(rendered).toContain('Artifact kind: Suggestion');
    expect(rendered).toContain('Evidence:');
    expect(rendered).toContain('1. Users cannot tell which pane owns input.');
    expect(rendered).toContain('Next action: Promote the first-run walkthrough into a canonical guided-flow block.');
  });
});
