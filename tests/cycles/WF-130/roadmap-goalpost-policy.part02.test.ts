import { readFileSync } from 'node:fs';
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
      const beyondRow = /\| `Beyond` \| \[Beyond\]\([^)]+\) \| (?<open>\d+) \| (?<closed>\d+) \|/.exec(roadmap);
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
