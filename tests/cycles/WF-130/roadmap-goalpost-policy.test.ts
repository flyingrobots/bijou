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
    const dx046Design = normalizeWhitespace(read('docs/design/DX-046-graphql-authored-dogfood-block-fixture.md'));

    expect(roadmap).toContain('Last synced from GitHub milestone items: 2026-06-15.');
    expect(roadmap).toContain('The latest shipped public release is');
    expect(roadmap).toContain('v7.1.0');
    expect(roadmap).toContain('v7.0.0');
    expect(roadmap).toContain('This roadmap is the forward-looking release horizon for Bijou.');
    expect(roadmap).toContain('`v7.1.0` is complete post-V7 minor release lineage');
    expect(roadmap).toContain('`v7.2.0` is now selected as a narrow stabilization and demo-integrity release.');
    expect(roadmap).toContain('Release Train Decision');
    expect(roadmap).toContain('`v7.1.0`: Shipped Post-V7 Minor');
    expect(roadmap).toContain('`v7.2.0`: Stabilization And Demo Integrity');
    expect(roadmap).toContain('`v8.0.0`: Runtime Graph And Scene IR Product Contract');
    expect(roadmap).toContain('`v9.0.0`: Product Workbench And Operator Surfaces');
    expect(roadmap).toContain('`v10.0.0+`: Ecosystem Integration');
    expect(roadmap).toContain('v6.0.0` was never published as a public package release');
    expect(roadmap).toContain('| `v7.2.0` | [v7.2.0](https://github.com/flyingrobots/bijou/milestone/5) | 10 | 0 |');
    expect(roadmap).toContain('| `v7.1.0` | [v7.1.0](https://github.com/flyingrobots/bijou/milestone/4) | 0 | 4 |');
    expect(roadmap).toContain('Latest shipped release lineage after the release PR merges.');
    expect(roadmap).toContain('#270 release-readiness guardrails, #312 DOGFOOD i18n debt coverage');
    expect(roadmap).toContain('`v6.0.0`');
    expect(roadmap).toContain('0 | 30');
    expect(roadmap).toContain('Skipped public release lane.');
    expect(roadmap).toContain('`v7.0.0`');
    expect(roadmap).toContain('0 | 27');
    expect(roadmap).toContain('Shipped release lineage.');
    expect(roadmap).toContain('`Beyond`');
    expect(roadmap).toContain('31 | 6');
    expect(roadmap).toContain('Next Pull');
    expect(roadmap).toContain('v7.2.0 framework input stabilization');
    expect(roadmap).toContain('workspace mouse fallthrough');
    expect(roadmap).toContain('versioned artifact semantics');
    expect(roadmap).toContain('DOGFOOD fixtures that round-trip');
    expect(roadmap).toContain('https://github.com/flyingrobots/bijou/issues/270');
    expect(roadmap).toContain('https://github.com/flyingrobots/bijou/issues/312');
    expect(roadmap).toContain('https://github.com/flyingrobots/bijou/issues/329');
    expect(roadmap).toContain('Forward Goalposts');
    expect(roadmap).toContain('Decision Points');
    expect(roadmap).toContain('Demo Integrity And Framework Input Stabilization');
    expect(roadmap).toContain('Runtime Graph And Scene IR Product Contract');
    expect(roadmap).toContain('Product Workbench And Operator Surfaces');
    expect(roadmap).toContain('Theme Lab and Theme Inspector provenance');
    expect(roadmap).toContain('localization workbench proof');
    expect(roadmap).toContain('terminal input controls');
    expect(roadmap).toContain('Open Unmilestoned Triage');
    expect(roadmap).toContain('[#352]');
    expect(roadmap).toContain('[#348]');
    expect(roadmap).toContain('[#321]');
    expect(roadmap).toContain('[#317]');
    expect(roadmap).toContain('[#316]');
    expect(roadmap).toContain('[#306]');
    expect(roadmap).toContain('[#249]');
    expect(roadmap).toContain('Open Pull Requests Outside Release Horizons');
    expect(roadmap).toContain('[#326]');
    expect(roadmap).toContain('was not selected for `v7.1.0`');
    expect(roadmap).toContain('until it is green, current, and deliberately selected');
    expect(roadmap).toContain('The `v7.1.0` GitHub milestone is closed release lineage.');
    expect(roadmap).toContain('Closed Lineage');
    expect(roadmap).toContain('Portable `ui-scene-ir/1` proof');
    expect(roadmap).toContain('Skipped public release; complete lineage');

    expect(roadmap).not.toContain('No next public release version is selected.');
    expect(roadmap).not.toContain('release-readiness validation before tagging');
    expect(roadmap).not.toContain('should not tag until release-readiness validation');
    expect(roadmap).not.toContain('Design Tokens And Theme Modes');
    expect(roadmap).not.toContain('Terminal Input And Host Controls');
    expect(roadmap).not.toContain('Workflow, Capture, And CI Determinism');
    expect(bearing).toContain('The latest shipped public release is `v7.1.0`');
    expect(bearing).toContain('The next feature horizon remains `v8.0.0`');
    expect(bearing).toContain('the immediate focus is');
    expect(bearing).toContain('`v7.2.0` is now selected as a narrow stabilization and demo-integrity release');
    expect(bearing).toContain('Stabilize V7.2, Then Shape V8 And V9 From Beyond');
    expect(bearing).not.toContain('The next release-facing action is release-readiness validation');

    expect(releaseRunbook).toContain('The latest shipped release is **`7.1.0`**.');
    expect(releaseRunbook).toContain('`7.2.0` is selected as a narrow stabilization and demo-integrity release');
    expect(releaseRunbook).toContain('New feature work should still shape toward `8.0.0`');
    expect(releaseRunbook).not.toContain('No next public release version is selected');

    expect(dx046Design).toContain('User story: [#329](https://github.com/flyingrobots/bijou/issues/329)');
    expect(dx046Design).toContain('Parent tracker: [#302](https://github.com/flyingrobots/bijou/issues/302)');
    expect(dx046Design).toContain('NavigationListBlock');
    expect(dx046Design).toContain('Tests To Write First');
  });

  it('disables Markdown line-length linting for project docs', () => {
    const markdownlintConfig = JSON.parse(read('.markdownlint.json')) as Record<string, unknown>;

    expect(markdownlintConfig.MD013).toBe(false);
    expect(markdownlintConfig['line-length']).toBe(false);
  });

  it('keeps outside-release PR sync filtered to unmilestoned pull requests', () => {
    const roadmap = read('docs/ROADMAP.md');
    const maintenanceRule = sectionBetween(roadmap, '## Maintenance Rule', 'When roadmap triage changes:');

    expect(maintenanceRule).toContain('gh search prs --repo flyingrobots/bijou --state open --no-milestone');
    expect(maintenanceRule).not.toContain('gh pr list --repo flyingrobots/bijou --state open');
  });

  it('keeps the broad issue 302 tracker on the v8 side of the release train', () => {
    const roadmap = read('docs/ROADMAP.md');
    const normalizedRoadmap = normalizeWhitespace(roadmap);
    const goalposts = sectionBetween(roadmap, '## Forward Goalposts', '## Decision Points');
    const v71Row = goalposts.split('\n').find(line => line.startsWith('| `v7.1.0` |')) ?? '';
    const v72Row = goalposts.split('\n').find(line => line.startsWith('| `v7.2.0` |')) ?? '';
    const v8Row = goalposts.split('\n').find(line => line.startsWith('| `v8.0.0` |')) ?? '';

    expect(v71Row).toContain('https://github.com/flyingrobots/bijou/issues/329');
    expect(v71Row).toContain('https://github.com/flyingrobots/bijou/issues/270');
    expect(v71Row).toContain('https://github.com/flyingrobots/bijou/issues/312');
    expect(v71Row).not.toContain('https://github.com/flyingrobots/bijou/issues/302');
    expect(v72Row).toContain('https://github.com/flyingrobots/bijou/issues/354');
    expect(v72Row).toContain('https://github.com/flyingrobots/bijou/issues/344');
    expect(v72Row).toContain('https://github.com/flyingrobots/bijou/issues/353');
    expect(v8Row).toContain('https://github.com/flyingrobots/bijou/issues/302');
    expect(normalizedRoadmap).toContain(
      'The broad #302 tracker stays in `Beyond` for `v8.0.0`; `v7.1.0` owns #329 as closed DX-046 lineage plus #270 and #312 as release-prep guardrails.',
    );
  });

  it('requires audit comments for moves across all release horizons', () => {
    const bearing = normalizeWhitespace(read('docs/BEARING.md'));

    expect(bearing).toContain('Any issue or pull request moved between release horizons');
    expect(bearing).toContain('`v7.1.0`, `v7.2.0`, `v8.0.0`, `v9.0.0`, `Beyond`');
    expect(bearing).not.toContain('Any issue moved between `v6.0.0`, `v7.0.0`, and `Beyond`');
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
    expect(beyondRow?.groups?.closed).toBe('6');

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
