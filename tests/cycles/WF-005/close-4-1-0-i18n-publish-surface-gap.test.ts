import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';

const I18N_PACKAGES = [
  'bijou-i18n',
  'bijou-i18n-tools',
  'bijou-i18n-tools-node',
  'bijou-i18n-tools-xlsx',
];

describe('WF-005 close 4.1.0 i18n publish-surface gap', () => {
  it('promotes the blocker into a landed workflow cycle', () => {
    expect(existsRepoPath('docs/design/WF-005-close-4-1-0-i18n-publish-surface-gap.md')).toBe(true);
    expect(existsRepoPath('docs/BACKLOG/v4.1.0/WF-005-close-4-1-0-i18n-publish-surface-gap.md')).toBe(false);

    const cycle = readRepoFile('docs/design/WF-005-close-4-1-0-i18n-publish-surface-gap.md');
    expect(cycle).toContain('The four i18n packages are part of the planned public `4.1.0` release.');
    expect(cycle).toContain('Local validation witness');
  });

  it('expands both release workflows to cover the i18n packages', () => {
    const publishWorkflow = readRepoFile('.github/workflows/publish.yml');
    const dryRunWorkflow = readRepoFile('.github/workflows/release-dry-run.yml');

    for (const pkg of I18N_PACKAGES) {
      expect(publishWorkflow).toContain(`packages/${pkg}`);
      expect(dryRunWorkflow).toContain(`packages/${pkg}`);
      expect(publishWorkflow).toContain(pkg);
      expect(dryRunWorkflow).toContain(pkg);
    }
  });

  it('keeps the publish workflow recoverable for an already-cut tag and avoids npm self-upgrade drift', () => {
    const publishWorkflow = readRepoFile('.github/workflows/publish.yml');
    const dryRunWorkflow = readRepoFile('.github/workflows/release-dry-run.yml');

    expect(publishWorkflow).toContain('workflow_dispatch:');
    expect(publishWorkflow).toContain('github.event.inputs.tag || github.ref_name');
    expect(publishWorkflow).toContain('github.event.inputs.ref || github.event.inputs.tag || github.ref_name');
    expect(publishWorkflow).toContain('Verify trusted-publishing toolchain');
    expect(publishWorkflow).toContain('NPM_VERSION="$(npm --version)"');
    expect(publishWorkflow).not.toContain('process.versions.npm');
    expect(publishWorkflow).not.toContain('npm i -g npm@latest');

    expect(dryRunWorkflow).toContain('Verify trusted-publishing toolchain');
    expect(dryRunWorkflow).toContain('NPM_VERSION="$(npm --version)"');
    expect(dryRunWorkflow).not.toContain('process.versions.npm');
    expect(dryRunWorkflow).not.toContain('npm i -g npm@latest');
  });

  it('updates the release docs to describe the i18n packages as part of 4.1.0', () => {
    const releaseGuide = readRepoFile('docs/release.md');
    const whatsNew = readRepoFile('docs/releases/4.1.0/whats-new.md');
    const migrationGuide = readRepoFile('docs/releases/4.1.0/migration-guide.md');

    expect(releaseGuide).toContain('@flyingrobots/bijou-i18n-tools-xlsx');
    expect(releaseGuide).not.toContain('they are **not** currently in the automated publish matrix');
    expect(releaseGuide).toContain("workflow's `workflow_dispatch` entrypoint");
    expect(releaseGuide).toContain('existing tag and release ref');
    expect(whatsNew).toContain('the i18n packages are now part of the planned');
    expect(migrationGuide).toContain('These i18n packages are part of the `4.1.0` automated publish');
  });
});
