import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';

describe('WF-126 v7 closeout tracker sync', () => {
  it('keeps BEARING on the live issue-complete v7 tracker state', () => {
    const bearing = readRepoFile('docs/BEARING.md');

    expect(bearing).toContain('V7 Product Truth');
    expect(bearing).toMatch(/zero open milestone\s+items and twenty-seven closed milestone\s+items/);
    expect(bearing).toContain('release-readiness validation');
    expect(bearing).not.toContain('Its current open count is three');
    expect(bearing).not.toContain('https://github.com/flyingrobots/bijou/issues/245');
    expect(bearing).not.toContain('https://github.com/flyingrobots/bijou/issues/246');
    expect(bearing).not.toContain('https://github.com/flyingrobots/bijou/issues/281');
    expect(bearing).not.toContain('https://github.com/flyingrobots/bijou/issues/238');
    expect(bearing).not.toContain('After this PR merges');
  });

  it('keeps ROADMAP v7 counts and open-work rows aligned with the current tracker', () => {
    const roadmap = readRepoFile('docs/ROADMAP.md');
    const v7 = sectionBetween(roadmap, '## v7.0.0', '## Beyond');
    const openWork = sectionBetween(v7, '### Open Work', '### Completed Lineage');
    const completedLineage = sectionBetween(v7, '### Completed Lineage', '### Component-Family Audits');

    expect(roadmap).toContain('| `v7.0.0` | [v7.0.0](https://github.com/flyingrobots/bijou/milestone/2) | 0 | 27 |');
    expect(openWork).toContain('No open v7 tracker issues remain as of 2026-06-03.');
    expect(openWork).not.toContain('https://github.com/flyingrobots/bijou/issues/245');
    expect(openWork).not.toContain('https://github.com/flyingrobots/bijou/issues/246');
    expect(openWork).not.toContain('https://github.com/flyingrobots/bijou/issues/281');
    expect(completedLineage).toContain('[#245](https://github.com/flyingrobots/bijou/issues/245)');
    expect(completedLineage).toContain('[#246](https://github.com/flyingrobots/bijou/issues/246)');
    expect(completedLineage).toContain('[#281](https://github.com/flyingrobots/bijou/issues/281)');
    expect(completedLineage).toContain('[#283](https://github.com/flyingrobots/bijou/issues/283)');
    expect(completedLineage).toContain('[#285](https://github.com/flyingrobots/bijou/issues/285)');
  });
});

function sectionBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
}
