import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createDogfoodStorybookWorkbenchModel } from '../../../examples/docs/storybook-workstation.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

describe('WF-163 Code Dojo ratchet', () => {
  it('records the historical goalpost and the current bounded target', () => {
    const exceptions = read('docs/code-dojo-exceptions.md');
    const design = read('docs/design/WF-163-respecting-dojo-ratchet-112.md');

    expect(exceptions).toMatch(/\| File\/context baseline\s+\|\s+37\s+\|/u);
    expect(exceptions).toMatch(/\| \*\*Total\*\*\s+\|\s+\*\*62\*\*\s+\|/u);
    expect(exceptions).toContain(
      'The next met goalpost must lower the ceiling to',
    );
    expect(exceptions).toMatch(/`12` or lower\./u);
    expect(design).toContain(
      '- Removed debt: `50` of the required `50` violations',
    );
    expect(design).toContain(
      '- Next goalpost target: `62` aggregate violations or lower',
    );
  });

  it('records the complete modern-cycle ownership and review contract', () => {
    const design = read('docs/design/WF-163-respecting-dojo-ratchet-112.md');
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

  it('forbids newly created files from entering the shrinking ledger', () => {
    const design = read('docs/design/WF-163-respecting-dojo-ratchet-112.md');

    expect(design).toContain(
      '- No newly created file exceeds `150` lines or `12,000` bytes.',
    );
    expect(design).toContain(
      '- Only pre-existing baselined paths may remain in the shrinking ledger.',
    );
    expect(design).not.toContain(
      'No new file exceeds `150` lines or `12,000` bytes unless it remains in the',
    );
  });

  it('preserves distinct family grouping across slug collisions', () => {
    const [first, second] = COMPONENT_STORIES;
    if (first == null || second == null)
      throw new Error('storybook regression requires two canonical stories');
    const family = 'é';
    const model = createDogfoodStorybookWorkbenchModel([
      { ...first, id: 'localized-family-a', family },
      { ...second, id: 'localized-family-b', family },
      { ...first, id: 'ascii-family', family: '6h' },
    ]);
    expect(model.familyCount).toBe(2);
    expect(model.families.find((entry) => entry.label === family)?.stories)
      .toHaveLength(2);
  });
});
