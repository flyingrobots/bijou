import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';

describe('WF-006 cut clean 4.1.0 release boundary', () => {
  it('promotes the final release-boundary blocker into a landed workflow cycle', () => {
    expect(existsRepoPath('docs/design/WF-006-cut-clean-4-1-0-release-boundary.md')).toBe(true);
    expect(existsRepoPath('docs/BACKLOG/v4.1.0/WF-006-cut-clean-4-1-0-release-boundary.md')).toBe(false);
  });

  it('keeps WF-006 landed even after the temporary version-target lane is pruned again', () => {
    expect(existsRepoPath('docs/BACKLOG/v4.1.0/README.md')).toBe(false);
    expect(existsRepoPath('docs/BACKLOG')).toBe(false);
    expect(existsRepoPath('docs/BACKLOG/v4.1.0')).toBe(false);
  });

  it('aligns the short-form release surfaces to the v4.0.0..HEAD boundary', () => {
    const readme = readRepoFile('README.md');
    const changelog = readRepoFile('docs/CHANGELOG.md');
    const releaseGuide = readRepoFile('docs/release.md');

    // README now reflects the latest release (4.2.0+), not 4.1.0.
    // The 4.1.0 release docs remain under docs/releases/4.1.0/.
    expect(readme).toMatch(/## What's New in v4\.\d+\.\d+/);
    expect(changelog).toContain('## [4.1.0] - 2026-04-04');
    expect(changelog).toContain('This release section is aligned to the actual `v4.0.0..v4.1.0`');
    expect(changelog).toContain('## [4.0.0] - 2026-03-22');
    expect(changelog).toMatch(/\[Unreleased\]: https:\/\/github\.com\/flyingrobots\/bijou\/compare\/v4\.\d+\.\d+\.\.\.HEAD/);
    expect(changelog).toContain('[4.1.0]: https://github.com/flyingrobots/bijou/compare/v4.0.0...v4.1.0');
    expect(changelog).toContain('[4.0.0]: https://github.com/flyingrobots/bijou/compare/v3.1.0...v4.0.0');
    expect(releaseGuide).toContain('moved the release smoke gate onto the DOGFOOD contract used for');
    expect(releaseGuide).not.toContain('This still reflects the current repo tooling, not the intended end');
  });

  it('keeps the signposts honest after 4.1.0 ships', () => {
    const bearing = readRepoFile('docs/BEARING.md');
    const releaseGuide = readRepoFile('docs/release.md');
    const workflowLegend = readRepoFile('docs/legends/WF-workflow-and-delivery.md');
    const dogfoodLegend = readRepoFile('docs/legends/DF-dogfood-field-guide.md');

    // BEARING evolves across releases; check that 4.1.0 and RE-007 are acknowledged
    expect(bearing).toContain('4.1.0');
    expect(bearing).toContain('RE-007');

    // Release guide evolves; check that it references the latest shipped release
    expect(releaseGuide).toMatch(/The latest shipped release is \*\*`4\.\d+\.\d+`\*\*\./);
    expect(releaseGuide).not.toContain('The currently shaped next release target is **`4.1.0`**.');

    expect(workflowLegend).toContain('no version-target release lane is active right now');
    expect(dogfoodLegend).toContain('DF-025 — Make DOGFOOD The Only Human-Facing Docs Surface');
  });
});
