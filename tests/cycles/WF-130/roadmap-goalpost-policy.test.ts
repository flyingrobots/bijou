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

    expect(roadmap).toContain('Last synced from GitHub milestone items: 2026-06-09.');
    expect(roadmap).toContain('`v6.0.0`');
    expect(roadmap).toContain('0 | 30');
    expect(roadmap).toContain('`v7.0.0`');
    expect(roadmap).toContain('0 | 27');
    expect(roadmap).toContain('`Beyond`');
    expect(roadmap).toContain('35 | 1');
    expect(roadmap).toContain('Candidate Goalposts From Open GitHub Issues');
    expect(roadmap).toContain('Runtime Graph And Scene IR');
    expect(roadmap).toContain('DOGFOOD And BlockLab Product Surface');
    expect(roadmap).toContain('Design Tokens And Theme Modes');
    expect(roadmap).toContain('Workflow And CI Determinism');
    expect(roadmap).toContain('Localization And Documentation Operations');
    expect(roadmap).toContain('[#306]');
    expect(roadmap).toContain('[#249]');
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
    expect(beyondRow?.groups?.closed).toBe('1');

    const openBeyondIssues = sectionBetween(
      roadmap,
      '### Open Beyond Issues',
      '### Closed Beyond Lineage',
    );
    const openIssueRows = openBeyondIssues
      .split('\n')
      .filter(line => /^\| \[#\d+\]\(https:\/\/github\.com\/flyingrobots\/bijou\/issues\/\d+\)/.test(line));

    expect(Number(beyondRow?.groups?.open)).toBe(openIssueRows.length);
  });
});
