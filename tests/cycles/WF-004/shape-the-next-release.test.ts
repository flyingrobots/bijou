import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';

describe('WF-004 shape the next release', () => {
  it('captures the next release as an explicit 4.1.0 decision', () => {
    const cycle = readRepoFile('docs/design/WF-004-shape-the-next-release.md');

    expect(cycle).toContain('The next release should be **`4.1.0`**, stable.');
    expect(cycle).toContain('`RE-007` is **not** a blocker for `4.1.0`.');
    expect(cycle).toContain('Ready when');
  });

  it('publishes versioned long-form release docs for 4.1.0', () => {
    expect(existsRepoPath('docs/releases/4.1.0/whats-new.md')).toBe(true);
    expect(existsRepoPath('docs/releases/4.1.0/migration-guide.md')).toBe(true);

    const releaseDocs = readRepoFile('docs/releases/README.md');
    expect(releaseDocs).toContain('4.1.0');
  });

  it('spawns explicit 4.1.0 follow-on cycles from the release-shaping decision', () => {
    expect(existsRepoPath('docs/design/WF-005-close-4-1-0-i18n-publish-surface-gap.md')).toBe(true);
    expect(existsRepoPath('docs/design/WF-006-cut-clean-4-1-0-release-boundary.md')).toBe(true);

    const cycle = readRepoFile('docs/design/WF-004-shape-the-next-release.md');
    expect(cycle).toContain('WF-005 — Close 4.1.0 i18n Publish-Surface Gap');
    expect(cycle).toContain('WF-006 — Cut Clean 4.1.0 Release Boundary');
  });
});
