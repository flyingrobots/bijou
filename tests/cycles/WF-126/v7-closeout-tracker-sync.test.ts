import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';

describe('WF-126 v7 closeout tracker sync', () => {
  it('keeps BEARING next target on the live v7 closeout issues', () => {
    const bearing = readRepoFile('docs/BEARING.md');

    expect(bearing).toContain('V7 Product Truth');
    expect(bearing).toContain('https://github.com/flyingrobots/bijou/issues/245');
    expect(bearing).toContain('https://github.com/flyingrobots/bijou/issues/246');
    expect(bearing).toContain('https://github.com/flyingrobots/bijou/issues/281');
    expect(bearing).not.toContain('https://github.com/flyingrobots/bijou/issues/238');
    expect(bearing).not.toContain('After this PR merges');
  });

  it('keeps ROADMAP v7 counts and open-work rows aligned with the current tracker', () => {
    const roadmap = readRepoFile('docs/ROADMAP.md');

    expect(roadmap).toContain('| `v7.0.0` | [v7.0.0](https://github.com/flyingrobots/bijou/milestone/2) | 3 |');
    expect(roadmap).toContain('[#245](https://github.com/flyingrobots/bijou/issues/245)');
    expect(roadmap).toContain('[#246](https://github.com/flyingrobots/bijou/issues/246)');
    expect(roadmap).toContain('[#281](https://github.com/flyingrobots/bijou/issues/281)');
    expect(roadmap).toContain('DOGFOOD release title screen');
  });
});
