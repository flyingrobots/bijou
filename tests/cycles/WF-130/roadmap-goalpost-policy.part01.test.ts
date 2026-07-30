import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'vitest';
import {
  expectClaims,
  expectNoClaims,
  normalized,
  read,
  ROOT,
  sectionBetween,
} from './roadmap-goalpost-policy.test-support.js';

describe('WF-130 roadmap goalpost policy', () => {
  it('documents release packets, goalposts, stories, slices, gates, and proof', () => {
    const releasePolicyPath = 'docs/method/releases/README.md';
    const releasePolicy = normalized(releasePolicyPath);

    if (!existsSync(resolve(ROOT, releasePolicyPath))) {
      throw new Error(`${releasePolicyPath} must exist`);
    }
    expectClaims(releasePolicy, [
      'Versioned Release',
      'Goalpost',
      'Umbrella Issue',
      'User Story Issue',
      'Slice Budget',
      'Release Gate',
      'Proof Policy',
      'vMAJOR.MINOR.PATCH',
      '`goalpost`',
      '`user-story`',
      'No implementation goalpost is complete through documentation alone.',
    ]);
  });

  it('retains every split workflow-policy proof case', () => {
    const proofSource = [1, 2, 3, 4, 5]
      .map((part) =>
        read(
          `tests/cycles/WF-130/roadmap-goalpost-policy.part0${String(part)}.test.ts`,
        ),
      )
      .join('\n');
    const declaredCases = Array.from(
      proofSource.matchAll(/^\s*it\('(?<name>[^']+)'/gmu),
      (match) => match.groups?.name ?? '',
    ).join('\n');

    expectClaims(declaredCases, [
      'keeps outside-release PR sync filtered to unmilestoned pull requests',
      'keeps the broad issue 302 tracker on the v8 side of the release train',
      'keeps staged v8 tracker details and sync commands aligned to the milestone',
      'requires audit comments for moves across all release horizons',
      'keeps Method and contributor cycle docs aligned to non-draft PRs',
      'adds issue-template fields for roadmap role and slice accounting',
      'keeps the Beyond open snapshot count aligned with the Open Beyond Issues table',
      'disables Markdown line-length linting for project docs',
      'keeps v7.2 release evidence replay commands aligned with split WF-130 proof files',
      'keeps v7.2 release evidence test paths replayable from the checkout',
      'publishes discoverable v7.2 release docs for the versioned package set',
      'keeps the v7.2 release packet aligned with release-prep and registry gates',
      'keeps dev-tooling dependency security in the v7.2 audit replay',
      'links the #458 VISOR artifact bundle cycle to DX-049',
    ]);
  });

  it('keeps outside-release PR sync filtered to unmilestoned pull requests', () => {
    const maintenance = sectionBetween(
      read('docs/ROADMAP.md'),
      '## Maintenance Rule',
      'When roadmap triage changes:',
    );
    expectClaims(maintenance, [
      'gh search prs --repo flyingrobots/bijou --state open --no-milestone',
    ]);
    expectNoClaims(maintenance, [
      'gh pr list --repo flyingrobots/bijou --state open',
    ]);
  });

  it('requires audit comments for moves across all release horizons', () => {
    const bearing = normalized('docs/BEARING.md');
    expectClaims(bearing, [
      'Any issue or pull request moved between release horizons',
      '`v7.1.0`, `v7.2.0`, `v8.0.0`, `v8.1.0`, `v8.2.0`, `v9.0.0`, `v10.0.0`, `Beyond`',
    ]);
    expectNoClaims(bearing, [
      'Any issue moved between `v6.0.0`, `v7.0.0`, and `Beyond`',
    ]);
  });

  it('keeps Method and contributor cycle docs aligned to non-draft PRs', () => {
    const sources = ['AGENTS.md', 'CONTRIBUTING.md', 'docs/METHOD.md', 'docs/WORKFLOW.md']
      .map(normalized);
    for (const source of sources) {
      expectNoClaims(source, [
        'open a draft',
        'Draft PRs are expected',
        'Open draft PRs',
        'mark the draft',
        'draft-first',
      ]);
    }
    expectClaims(sources.join('\n'), [
      'open a non-draft pull request to `main`',
      'Open a non-draft PR at cycle start',
    ]);
  });

  it('adds issue-template fields for roadmap role and slice accounting', () => {
    expectClaims(read('.github/ISSUE_TEMPLATE/work-item.yml'), [
      'id: roadmap-role',
      'Goalpost umbrella',
      'User story',
      'id: roadmap-linkage',
      'id: slice-budget',
      'id: release-gate',
      'Issue, design doc, and non-draft PR are linked correctly.',
    ]);
  });
});
