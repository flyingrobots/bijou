import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';

describe('WF-003 replace smoke examples with smoke dogfood', () => {
  it('promotes the blocker into a landed workflow cycle and prunes the temporary lane', () => {
    expect(existsRepoPath('docs/design/WF-003-replace-smoke-examples-with-smoke-dogfood.md')).toBe(true);
    expect(existsRepoPath('docs/BACKLOG/v4.1.0/WF-003-replace-smoke-examples-with-smoke-dogfood.md')).toBe(false);
    expect(existsRepoPath('docs/BACKLOG/v4.1.0/README.md')).toBe(false);

    const cycle = readRepoFile('docs/design/WF-003-replace-smoke-examples-with-smoke-dogfood.md');
    expect(cycle).toContain('The public `4.1.0` smoke contract now belongs to DOGFOOD.');
    expect(cycle).toContain('examples/docs/capture-main.ts');
    expect(cycle).toContain('smoke:dogfood');
  });

  it('replaces the public smoke commands and release-readiness gate', () => {
    const packageJson = readRepoFile('package.json');
    const releaseReadiness = readRepoFile('scripts/release-readiness.ts');
    const migration = readRepoFile('docs/MIGRATING_TO_V4.md');

    expect(packageJson).toContain('smoke:dogfood');
    expect(packageJson).toContain('smoke:dogfood:landing');
    expect(packageJson).toContain('smoke:dogfood:docs');
    expect(packageJson).not.toContain('smoke:examples');
    expect(releaseReadiness).toContain("label: 'smoke:dogfood'");
    expect(releaseReadiness).toContain("'run', 'smoke:dogfood', '--', '--skip-build'");
    expect(migration).toContain('npm run smoke:dogfood -- --skip-build');
  });

  it('switches CI and release workflows to DOGFOOD smoke lanes', () => {
    const ci = readRepoFile('.github/workflows/ci.yml');
    const dryRun = readRepoFile('.github/workflows/release-dry-run.yml');
    const publish = readRepoFile('.github/workflows/publish.yml');

    for (const workflow of [ci, dryRun, publish]) {
      expect(workflow).toContain('smoke:dogfood:landing');
      expect(workflow).toContain('smoke:dogfood:docs');
      expect(workflow).not.toContain('smoke:examples:pipe');
      expect(workflow).not.toContain('smoke:examples:static');
      expect(workflow).not.toContain('smoke:examples:interactive');
    }
  });

  it('updates release-facing docs to treat DOGFOOD as the smoke contract', () => {
    const release = readRepoFile('docs/release.md');
    const examples = readRepoFile('docs/EXAMPLES.md');
    const changelog = readRepoFile('docs/CHANGELOG.md');

    expect(release).toContain('smoke:dogfood`, `smoke:dogfood:landing`, and `smoke:dogfood:docs`');
    expect(examples).toContain('Release smoke now runs through `smoke:dogfood`.');
    expect(changelog).toContain('DOGFOOD is now the release-facing smoke contract');
  });
});
