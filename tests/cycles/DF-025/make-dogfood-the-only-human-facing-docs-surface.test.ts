import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';

describe('DF-025 make DOGFOOD the only human-facing docs surface', () => {
  it('captures the DOGFOOD-only public docs decision', () => {
    const cycle = readRepoFile('docs/design/DF-025-make-dogfood-the-only-human-facing-docs-surface.md');

    expect(cycle).toContain('only human-facing docs surface');
    expect(cycle).toContain('examples/');
    expect(cycle).toContain('secondary/internal');
    expect(cycle).toContain('WF-003');
    expect(cycle).toContain('DF-026');
  });

  it('publishes a repo-owned DOGFOOD entrypoint and release blockers', () => {
    expect(existsRepoPath('docs/DOGFOOD.md')).toBe(true);
    expect(existsRepoPath('docs/BACKLOG/v4.1.0/WF-003-replace-smoke-examples-with-smoke-dogfood.md')).toBe(true);
    expect(existsRepoPath('docs/design/DF-023-publish-repo-package-and-release-guides-in-dogfood.md')).toBe(true);
    expect(existsRepoPath('docs/design/DF-024-publish-philosophy-architecture-and-doctrine-guides-in-dogfood.md')).toBe(true);
    expect(existsRepoPath('docs/design/DF-026-demote-examples-to-secondary-reference-status.md')).toBe(true);

    const dogfood = readRepoFile('docs/DOGFOOD.md');
    expect(dogfood).toContain('canonical human-facing docs surface');
    expect(dogfood).toContain('package guides for the published workspace');
    expect(dogfood).toContain('doctrine, architecture, invariants, and design-system guidance');

    const lane = readRepoFile('docs/BACKLOG/v4.1.0/README.md');
    expect(lane).toContain('Just closed');
    expect(lane).toContain('DF-024');
    expect(lane).toContain('DF-026');
    expect(lane).toContain('WF-003');
  });

  it('updates front-door and release docs to reflect the DOGFOOD-only posture', () => {
    const root = readRepoFile('README.md');
    const docs = readRepoFile('docs/README.md');
    const release = readRepoFile('docs/release.md');
    const examples = readRepoFile('examples/README.md');

    expect(root).toContain('[DOGFOOD](./docs/DOGFOOD.md)');
    expect(root).toContain('examples/` tree is');
    expect(docs).toContain('[DOGFOOD](./DOGFOOD.md)');
    expect(release).toContain('WF-003');
    expect(examples).toContain('secondary/internal inventory');
  });
});
