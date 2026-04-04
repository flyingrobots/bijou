import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';

describe('DF-021 shape DOGFOOD as terminal docs system', () => {
  it('captures the docs-site decision and missing top-level sections', () => {
    const cycle = readRepoFile('docs/design/DF-021-shape-dogfood-as-terminal-docs-system.md');

    expect(cycle).toContain('terminal documentation system');
    expect(cycle).toContain('Start Here / Guides');
    expect(cycle).toContain('Components');
    expect(cycle).toContain('Packages');
    expect(cycle).toContain('Philosophy / Architecture');
    expect(cycle).toContain('Release / Migration');
  });

  it('spawns explicit DOGFOOD follow-on cycles that now exist as landed design docs', () => {
    expect(existsRepoPath('docs/BACKLOG/v4.1.0/README.md')).toBe(false);
    expect(existsRepoPath('docs/design/DF-022-build-prose-docs-reader-and-top-level-dogfood-nav.md')).toBe(true);
    expect(existsRepoPath('docs/design/DF-023-publish-repo-package-and-release-guides-in-dogfood.md')).toBe(true);
    expect(existsRepoPath('docs/design/DF-024-publish-philosophy-architecture-and-doctrine-guides-in-dogfood.md')).toBe(true);
    expect(existsRepoPath('docs/design/WF-003-replace-smoke-examples-with-smoke-dogfood.md')).toBe(true);
  });

  it('updates the release signposts to acknowledge the DOGFOOD follow-through and smoke closure', () => {
    const plan = readRepoFile('docs/PLAN.md');
    const bearing = readRepoFile('docs/BEARING.md');
    const release = readRepoFile('docs/release.md');

    expect(plan).toContain('DF-021');
    expect(plan).toContain('DF-022');
    expect(plan).toContain('DF-023');
    expect(plan).toContain('DF-024');
    expect(plan).toContain('WF-003');
    expect(bearing).toContain('DF-022');
    expect(bearing).toContain('DF-023');
    expect(bearing).toContain('DF-024');
    expect(bearing).toContain('WF-003');
    expect(release).toContain('DF-023');
    expect(release).toContain('DF-024');
    expect(release).toContain('smoke:dogfood');
  });
});
