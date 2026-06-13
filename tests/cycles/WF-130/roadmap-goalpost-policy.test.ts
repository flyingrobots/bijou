import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

function normalizeWhitespace(source: string): string {
  return source.replace(/\s+/g, ' ').trim();
}

function sectionBetween(source: string, startHeading: string, endHeading: string): string {
  const start = source.indexOf(startHeading);
  if (start === -1) throw new Error(`Missing start heading ${startHeading}`);
  const end = source.indexOf(endHeading, start + startHeading.length);
  if (end === -1) throw new Error(`Missing end heading ${endHeading}`);
  return source.slice(start, end);
}

describe('WF-130 roadmap goalpost policy', () => {
  it('documents release packets, goalposts, stories, slices, gates, and proof', () => {
    expect(existsSync(resolve(ROOT, 'docs/method/releases/README.md'))).toBe(true);

    const releasePolicy = normalizeWhitespace(read('docs/method/releases/README.md'));

    expect(releasePolicy).toContain('Versioned Release');
    expect(releasePolicy).toContain('Goalpost');
    expect(releasePolicy).toContain('Umbrella Issue');
    expect(releasePolicy).toContain('User Story Issue');
    expect(releasePolicy).toContain('Slice Budget');
    expect(releasePolicy).toContain('Release Gate');
    expect(releasePolicy).toContain('Proof Policy');
    expect(releasePolicy).toContain('vMAJOR.MINOR.PATCH');
    expect(releasePolicy).toContain('`goalpost`');
    expect(releasePolicy).toContain('`user-story`');
    expect(releasePolicy).toContain('No implementation goalpost is complete through documentation alone.');
  });

  it('makes roadmap state GitHub-backed and groups current open tracker work', () => {
    const roadmap = normalizeWhitespace(read('docs/ROADMAP.md'));
    const bearing = normalizeWhitespace(read('docs/BEARING.md'));
    const releaseRunbook = normalizeWhitespace(read('docs/release.md'));

    expect(roadmap).toContain('Last synced from GitHub milestone items: 2026-06-13.');
    expect(roadmap).toContain('The latest shipped public release is');
    expect(roadmap).toContain('v7.0.0');
    expect(roadmap).toContain('This roadmap is the forward-looking release horizon for Bijou.');
    expect(roadmap).toContain('The next selected public release target is **`v7.1.0`**');
    expect(roadmap).toContain('There is no planned `v7.2.0` feature train.');
    expect(roadmap).toContain('Release Train Decision');
    expect(roadmap).toContain('`v7.1.0`: Post-V7 Minor');
    expect(roadmap).toContain('`v8.0.0`: Runtime Graph And Scene IR Product Contract');
    expect(roadmap).toContain('`v9.0.0`: Product Workbench And Operator Surfaces');
    expect(roadmap).toContain('`v10.0.0+`: Ecosystem Integration');
    expect(roadmap).toContain('v6.0.0` was never published as a public package release');
    expect(roadmap).toContain('`v6.0.0`');
    expect(roadmap).toContain('0 | 30');
    expect(roadmap).toContain('Skipped public release lane.');
    expect(roadmap).toContain('`v7.0.0`');
    expect(roadmap).toContain('0 | 27');
    expect(roadmap).toContain('Latest shipped release lineage.');
    expect(roadmap).toContain('`Beyond`');
    expect(roadmap).toContain('33 | 4');
    expect(roadmap).toContain('Next Pull');
    expect(roadmap).toContain('DX-046: GraphQL-authored DOGFOOD block fixture for #302');
    expect(roadmap).toContain('Forward Goalposts');
    expect(roadmap).toContain('Decision Points');
    expect(roadmap).toContain('Runtime Graph And Scene IR Product Contract');
    expect(roadmap).toContain('Product Workbench And Operator Surfaces');
    expect(roadmap).toContain('Theme Lab and Theme Inspector provenance');
    expect(roadmap).toContain('localization workbench proof');
    expect(roadmap).toContain('terminal input controls');
    expect(roadmap).toContain('Open Unmilestoned Triage');
    expect(roadmap).toContain('[#321]');
    expect(roadmap).toContain('[#317]');
    expect(roadmap).toContain('[#316]');
    expect(roadmap).toContain('[#306]');
    expect(roadmap).toContain('[#249]');
    expect(roadmap).toContain('Open Pull Requests Outside Release Horizons');
    expect(roadmap).toContain('[#326]');
    expect(roadmap).toContain('Closed Lineage');
    expect(roadmap).toContain('Skipped public release; complete lineage');

    expect(roadmap).not.toContain('No next public release version is selected.');
    expect(roadmap).not.toContain('release-readiness validation before tagging');
    expect(roadmap).not.toContain('should not tag until release-readiness validation');
    expect(bearing).toContain('The latest shipped public release is `v7.0.0`');
    expect(bearing).toContain('The next selected public release target is `v7.1.0`');
    expect(bearing).toContain('There is no planned `v7.2.0` feature train.');
    expect(bearing).toContain('Shape V8 And V9 From Beyond');
    expect(bearing).not.toContain('The next release-facing action is release-readiness validation');

    expect(releaseRunbook).toContain('The next selected public release target is **`7.1.0`**');
    expect(releaseRunbook).toContain('There is no planned feature `7.2.0` train.');
    expect(releaseRunbook).not.toContain('No next public release version is selected');
  });

  it('keeps Method and contributor cycle docs aligned to non-draft PRs', () => {
    const agents = normalizeWhitespace(read('AGENTS.md'));
    const contributing = normalizeWhitespace(read('CONTRIBUTING.md'));
    const method = normalizeWhitespace(read('docs/METHOD.md'));
    const workflow = normalizeWhitespace(read('docs/WORKFLOW.md'));

    for (const source of [agents, contributing, method, workflow]) {
      expect(source).not.toContain('open a draft');
      expect(source).not.toContain('Draft PRs are expected');
      expect(source).not.toContain('Open draft PRs');
      expect(source).not.toContain('mark the draft');
      expect(source).not.toContain('draft-first');
    }

    expect(method).toContain('open a non-draft pull request to `main`');
    expect(workflow).toContain('open a non-draft pull request to `main`');
    expect(contributing).toContain('Open a non-draft PR at cycle start');
    expect(agents).toContain('open a non-draft pull request to `main`');
  });

  it('adds issue-template fields for roadmap role and slice accounting', () => {
    const issueTemplate = read('.github/ISSUE_TEMPLATE/work-item.yml');

    expect(issueTemplate).toContain('id: roadmap-role');
    expect(issueTemplate).toContain('Goalpost umbrella');
    expect(issueTemplate).toContain('User story');
    expect(issueTemplate).toContain('id: roadmap-linkage');
    expect(issueTemplate).toContain('id: slice-budget');
    expect(issueTemplate).toContain('id: release-gate');
    expect(issueTemplate).toContain('Issue, design doc, and non-draft PR are linked correctly.');
  });

  it('keeps the Beyond open snapshot count aligned with the Open Beyond Issues table', () => {
    const roadmap = read('docs/ROADMAP.md');
    const beyondRow = roadmap.match(/\| `Beyond` \| \[Beyond\]\([^)]+\) \| (?<open>\d+) \| (?<closed>\d+) \|/);
    expect(beyondRow?.groups?.closed).toBe('4');

    const openBeyondIssues = sectionBetween(
      roadmap,
      '## Open Beyond Issues',
      '## Open Unmilestoned Triage',
    );
    const openIssueRows = openBeyondIssues
      .split('\n')
      .filter(line => /^\| \[#\d+\]\(https:\/\/github\.com\/flyingrobots\/bijou\/issues\/\d+\)/.test(line));

    expect(Number(beyondRow?.groups?.open)).toBe(openIssueRows.length);
  });
});
