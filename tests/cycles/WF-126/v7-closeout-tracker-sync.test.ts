import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';

describe('WF-126 v7 closeout tracker sync', () => {

  it('keeps compressed ROADMAP v7 lineage aligned with issue-specific evidence', () => {
    const releaseTitleDesign = readRepoFile('docs/design/DF-060-v7-dogfood-release-title-screen.md');
    const reviewFixDesign = readRepoFile('docs/design/DX-040-v7-review-regression-fixes.md');
    const trackerSyncDesign = readRepoFile('docs/design/WF-127-v7-issue-complete-tracker-sync.md');
    expect(releaseTitleDesign).toContain('[#245](https://github.com/flyingrobots/bijou/issues/245)');
    expect(releaseTitleDesign).toContain('[#246](https://github.com/flyingrobots/bijou/issues/246)');
    expect(releaseTitleDesign).toContain('[#281](https://github.com/flyingrobots/bijou/issues/281)');
    expect(reviewFixDesign).toContain('Issue #283 is closed by the follow-up PR.');
    expect(trackerSyncDesign).toContain('Issue #285 is closed by the PR.');
  });
});
