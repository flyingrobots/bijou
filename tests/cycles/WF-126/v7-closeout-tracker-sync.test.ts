import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';

describe('WF-126 v7 closeout tracker sync', () => {
  it('keeps BEARING on the live issue-complete v7 tracker state', () => {
    const bearing = readRepoFile('docs/BEARING.md');
    const normalizedBearing = bearing.replace(/\s+/g, ' ').trim();

    expect(bearing).toContain('The latest shipped public release is `v7.1.0`');
    expect(normalizedBearing).toContain('are complete release lineage, not the next implementation target');
    expect(bearing).toContain('The next feature horizon is `v8.0.0`');
    expect(bearing).toContain('There is no planned `v7.2.0` feature train.');
    expect(bearing).not.toContain('Its current open count is three');
    expect(bearing).not.toContain('https://github.com/flyingrobots/bijou/issues/245');
    expect(bearing).not.toContain('https://github.com/flyingrobots/bijou/issues/246');
    expect(bearing).not.toContain('https://github.com/flyingrobots/bijou/issues/281');
    expect(bearing).not.toContain('https://github.com/flyingrobots/bijou/issues/238');
    expect(bearing).not.toContain('After this PR merges');
  });

  it('keeps compressed ROADMAP v7 lineage aligned with issue-specific evidence', () => {
    const roadmap = readRepoFile('docs/ROADMAP.md');
    const releaseTitleDesign = readRepoFile('docs/design/DF-060-v7-dogfood-release-title-screen.md');
    const reviewFixDesign = readRepoFile('docs/design/DX-040-v7-review-regression-fixes.md');
    const trackerSyncDesign = readRepoFile('docs/design/WF-127-v7-issue-complete-tracker-sync.md');
    const closedLineage = sectionBetween(roadmap, '## Closed Lineage', '## Maintenance Rule');

    expect(roadmap).toContain('| `v7.0.0` | [v7.0.0](https://github.com/flyingrobots/bijou/milestone/2) | 0 | 27 |');
    expect(closedLineage).toContain('`v7.0.0`');
    expect(closedLineage).toContain('Shipped public release');
    expect(closedLineage).toContain('Full lineage lives in the [v7.0.0 milestone]');
    expect(roadmap).not.toContain('### Open Work');
    expect(roadmap).not.toContain('https://github.com/flyingrobots/bijou/issues/245');
    expect(roadmap).not.toContain('https://github.com/flyingrobots/bijou/issues/246');
    expect(roadmap).not.toContain('https://github.com/flyingrobots/bijou/issues/281');
    expect(releaseTitleDesign).toContain('[#245](https://github.com/flyingrobots/bijou/issues/245)');
    expect(releaseTitleDesign).toContain('[#246](https://github.com/flyingrobots/bijou/issues/246)');
    expect(releaseTitleDesign).toContain('[#281](https://github.com/flyingrobots/bijou/issues/281)');
    expect(reviewFixDesign).toContain('Issue #283 is closed by the follow-up PR.');
    expect(trackerSyncDesign).toContain('Issue #285 is closed by the PR.');
  });
});

function sectionBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
}
