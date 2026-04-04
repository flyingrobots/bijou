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

  it('spawns explicit 4.1.0 blocker items for the missing DOGFOOD docs surfaces', () => {
    expect(existsRepoPath('docs/BACKLOG/v4.1.0/README.md')).toBe(true);
    expect(existsRepoPath('docs/design/DF-022-build-prose-docs-reader-and-top-level-dogfood-nav.md')).toBe(true);
    expect(existsRepoPath('docs/BACKLOG/v4.1.0/DF-023-publish-repo-package-and-release-guides-in-dogfood.md')).toBe(true);
    expect(existsRepoPath('docs/BACKLOG/v4.1.0/DF-024-publish-philosophy-architecture-and-doctrine-guides-in-dogfood.md')).toBe(true);

    const lane = readRepoFile('docs/BACKLOG/v4.1.0/README.md');
    expect(lane).toContain('Just closed');
    expect(lane).toContain('DF-022');
    expect(lane).toContain('DF-023');
    expect(lane).toContain('DF-024');
  });

  it('updates the release signposts to acknowledge reopened 4.1.0 blockers', () => {
    const plan = readRepoFile('docs/PLAN.md');
    const bearing = readRepoFile('docs/BEARING.md');
    const release = readRepoFile('docs/release.md');

    expect(plan).toContain('DF-021');
    expect(plan).toContain('DF-022');
    expect(plan).toContain('docs/BACKLOG/v4.1.0/');
    expect(bearing).toContain('DF-022');
    expect(bearing).toContain('docs/BACKLOG/v4.1.0/');
    expect(release).toContain('docs/BACKLOG/v4.1.0/');
    expect(release).toContain('DF-023');
    expect(release).toContain('DF-024');
  });
});
