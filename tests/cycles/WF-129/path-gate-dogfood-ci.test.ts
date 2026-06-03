import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';

describe('WF-129 path-gate DOGFOOD CI', () => {
  it('documents the cycle and classifier contract', () => {
    const design = readRepoFile('docs/design/WF-129-path-gate-dogfood-ci.md');

    expect(existsRepoPath('docs/design/WF-129-path-gate-dogfood-ci.md')).toBe(true);
    expect(design).toContain('Issue #293 is closed by the PR.');
    expect(design).toContain('Pushes to `main` and tags still set the DOGFOOD classifier to true.');
  });

  it('classifies DOGFOOD-relevant PR paths before CI jobs run', () => {
    const ci = readRepoFile('.github/workflows/ci.yml');

    expect(ci).toContain('changes:');
    expect(ci).toContain('name: Classify changed paths');
    expect(ci).toContain('dogfood: ${{ steps.dogfood.outputs.dogfood }}');
    expect(ci).toContain('id: dogfood');
    expect(ci).toContain('if [ "${GITHUB_EVENT_NAME}" != "pull_request" ]; then');
    expect(ci).toContain('echo "dogfood=true" >> "$GITHUB_OUTPUT"');
    expect(ci).toContain('diff_args=(HEAD^1 HEAD)');
    expect(ci).toContain('git diff --name-only "${diff_args[@]}"');

    for (const triggerPath of [
      '.github/workflows/*',
      'package.json',
      'package-lock.json',
      'packages/*',
      'examples/docs/*',
      'scripts/dogfood-*',
      'scripts/smoke-dogfood*',
      'tests/cycles/DF-*',
      'tests/cycles/*dogfood*',
      'docs/DOGFOOD.md',
      'docs/design/DF-*',
      'docs/legends/DF-*',
      'docs/method/legends/DF-*',
    ]) {
      expect(ci).toContain(triggerPath);
    }
  });

  it('gates DOGFOOD-heavy CI lanes on the classifier for PRs', () => {
    const ci = readRepoFile('.github/workflows/ci.yml');

    expect(ci).toMatch(/test:\n(?:[\s\S]*?)needs: changes/);
    expect(ci).toContain("if: matrix.node-version == 22 && needs.changes.outputs.dogfood == 'true'");
    expect(ci).toMatch(/name: DOGFOOD coverage gate[\s\S]*?needs\.changes\.outputs\.dogfood == 'true'/);
    expect(ci).toMatch(/name: DOGFOOD i18n policy gate[\s\S]*?needs\.changes\.outputs\.dogfood == 'true'/);

    expect(ci).toMatch(/smoke_dogfood:\n(?:[\s\S]*?)needs: changes/);
    expect(ci).toContain('name: Skip unrelated DOGFOOD smoke');
    expect(ci).toContain("if: needs.changes.outputs.dogfood != 'true'");
    expect(ci).toContain(
      "- uses: actions/checkout@v6\n        if: needs.changes.outputs.dogfood == 'true'",
    );
    expect(ci).toContain(
      "- if: needs.changes.outputs.dogfood == 'true'\n        run: npm run ${{ matrix.lane.command }}",
    );
  });

  it('records the CI speedup in the changelog', () => {
    const changelog = readRepoFile('docs/CHANGELOG.md');
    const normalizedChangelog = normalizeWhitespace(changelog);

    expect(changelog).toContain('DOGFOOD CI path gates');
    expect(normalizedChangelog).toContain('This closes issue #293.');
  });
});

function normalizeWhitespace(source: string): string {
  return source.replace(/\s+/g, ' ').trim();
}
