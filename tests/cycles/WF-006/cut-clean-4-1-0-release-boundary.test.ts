import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';

describe('WF-006 cut clean 4.1.0 release boundary', () => {
  it('promotes the final release-boundary blocker into a landed workflow cycle', () => {
    expect(existsRepoPath('docs/design/WF-006-cut-clean-4-1-0-release-boundary.md')).toBe(true);
    expect(existsRepoPath('docs/BACKLOG/v4.1.0/WF-006-cut-clean-4-1-0-release-boundary.md')).toBe(false);
  });

  it('prunes the temporary v4.1.0 blocker lane once cycle-shaped blockers are closed', () => {
    expect(existsRepoPath('docs/BACKLOG/v4.1.0/README.md')).toBe(false);

    const backlogReadme = readRepoFile('docs/BACKLOG/README.md');
    expect(backlogReadme).toContain('No version-target release lane is active right now.');
    expect(backlogReadme).not.toContain('[`v4.1.0/`](./v4.1.0/README.md)');
  });

  it('aligns the short-form release surfaces to the v4.0.0..HEAD boundary', () => {
    const readme = readRepoFile('README.md');
    const changelog = readRepoFile('docs/CHANGELOG.md');

    expect(readme).toContain("## What's New in v4.1.0");
    expect(readme).toContain('./docs/releases/4.1.0/whats-new.md');
    expect(changelog).toContain('planned `4.1.0` release slice');
    expect(changelog).toContain('## [4.0.0] - 2026-03-22');
    expect(changelog).toContain('[Unreleased]: https://github.com/flyingrobots/bijou/compare/v4.0.0...HEAD');
    expect(changelog).toContain('[4.0.0]: https://github.com/flyingrobots/bijou/compare/v3.1.0...v4.0.0');
  });
});
