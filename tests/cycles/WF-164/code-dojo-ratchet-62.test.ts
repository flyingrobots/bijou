import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../../..');

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

describe('WF-164 Code Dojo ratchet', () => {
  it('retains the completed 62-debt goalpost witness', () => {
    const design = read('docs/design/WF-164-respecting-dojo-ratchet-62.md');

    expect(design).toContain('- Aggregate Code Dojo debt: `62`');
    expect(design).toContain('- File/context baseline: `37`');
    expect(design).toContain(
      '- Code-size baseline: `25`, including `3` hard-limit files',
    );
  });

  it('records the completed goalpost and the next bounded target', () => {
    const design = read('docs/design/WF-164-respecting-dojo-ratchet-62.md');

    expect(design).toContain(
      '- Removed combined DX-050 debt: `50` of the required `50` violations',
    );
    expect(design).toContain(
      '- Next goalpost target: `12` aggregate violations or lower',
    );
  });

  it('records the complete modern-cycle ownership and review contract', () => {
    const design = read('docs/design/WF-164-respecting-dojo-ratchet-62.md');
    const requiredClaims = [
      'Legend: [WF — Workflow and Delivery](../legends/WF-workflow-and-delivery.md)',
      '## Sponsor Human',
      '## Sponsor Agent',
      '## Accessibility And Assistive Posture',
      '## Localization And Directionality Posture',
      '## Agent Inspectability And Explainability Posture',
      '## Implementation Outline',
      '## Tests To Write First',
      '## Retrospective And Closeout',
    ];

    for (const claim of requiredClaims) {
      expect(design, claim).toContain(claim);
    }
  });
});
