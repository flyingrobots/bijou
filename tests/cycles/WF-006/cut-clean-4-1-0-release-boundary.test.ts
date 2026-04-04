import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';

describe('WF-006 cut clean 4.1.0 release boundary', () => {
  it('promotes the final release-boundary blocker into a landed workflow cycle', () => {
    expect(existsRepoPath('docs/design/WF-006-cut-clean-4-1-0-release-boundary.md')).toBe(true);
    expect(existsRepoPath('docs/BACKLOG/v4.1.0/WF-006-cut-clean-4-1-0-release-boundary.md')).toBe(false);
  });

  it('keeps WF-006 landed even after the temporary version-target lane is pruned again', () => {
    expect(existsRepoPath('docs/BACKLOG/v4.1.0/README.md')).toBe(false);

    const backlogReadme = readRepoFile('docs/BACKLOG/README.md');
    expect(backlogReadme).toContain('There is no active version-target release lane right now.');
  });

  it('aligns the short-form release surfaces to the v4.0.0..HEAD boundary', () => {
    const readme = readRepoFile('README.md');
    const changelog = readRepoFile('docs/CHANGELOG.md');
    const releaseGuide = readRepoFile('docs/release.md');

    expect(readme).toContain("## What's New in v4.1.0");
    expect(readme).toContain('Bijou `v4.1.0` is the current release.');
    expect(readme).toContain('./docs/releases/4.1.0/whats-new.md');
    expect(changelog).toContain('## [4.1.0] - 2026-04-04');
    expect(changelog).toContain('This release section is aligned to the actual `v4.0.0..v4.1.0`');
    expect(changelog).toContain('## [4.0.0] - 2026-03-22');
    expect(changelog).toContain('[Unreleased]: https://github.com/flyingrobots/bijou/compare/v4.1.0...HEAD');
    expect(changelog).toContain('[4.1.0]: https://github.com/flyingrobots/bijou/compare/v4.0.0...v4.1.0');
    expect(changelog).toContain('[4.0.0]: https://github.com/flyingrobots/bijou/compare/v3.1.0...v4.0.0');
    expect(releaseGuide).toContain('moved the release smoke gate onto the DOGFOOD contract used for');
    expect(releaseGuide).not.toContain('This still reflects the current repo tooling, not the intended end');
  });

  it('keeps the signposts honest after 4.1.0 ships', () => {
    const plan = readRepoFile('docs/PLAN.md');
    const bearing = readRepoFile('docs/BEARING.md');
    const releaseGuide = readRepoFile('docs/release.md');
    const workflowLegend = readRepoFile('docs/legends/WF-workflow-and-delivery.md');
    const dogfoodLegend = readRepoFile('docs/legends/DF-dogfood-field-guide.md');

    expect(plan).toContain('Bijou has shipped `4.1.0`');
    expect(plan).toContain('## Next Active Cycle');
    expect(plan).toContain('RE-007 — Migrate Framed Shell Onto Runtime Engine Seams');
    expect(plan).not.toContain('## Before 4.1.0 Ships');

    expect(bearing).toContain('Return to post-`4.1.0` engineering work');
    expect(bearing).toContain('treat `4.1.0` as shipped truth');
    expect(bearing).toContain('[RE-007](./BACKLOG/up-next/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)');

    expect(releaseGuide).toContain('The latest shipped release is **`4.1.0`**.');
    expect(releaseGuide).toContain('The next release is intentionally **not shaped yet**.');
    expect(releaseGuide).not.toContain('The currently shaped next release target is **`4.1.0`**.');

    expect(workflowLegend).toContain('`4.1.0` is shipped');
    expect(workflowLegend).toContain('no version-target release lane is active right now');
    expect(dogfoodLegend).toContain('DF-025 — Make DOGFOOD The Only Human-Facing Docs Surface');
  });
});
