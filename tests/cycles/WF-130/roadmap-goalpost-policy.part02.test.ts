import { describe, expect, it } from 'vitest';
import {
  expectClaims,
  normalized,
  read,
  sectionBetween,
} from './roadmap-goalpost-policy.test-support.js';

describe('WF-130 roadmap release state', () => {
  it('keeps the release horizon and milestone snapshot explicit', () => {
    const roadmap = normalized('docs/ROADMAP.md');

    expectClaims(roadmap, [
      'This roadmap is the forward-looking release horizon for Bijou.',
      'Last synced from GitHub milestone items: 2026-07-30.',
      'These are planning recommendations from the open tracker state as of 2026-07-30.',
      'The latest shipped public release is',
      '`v7.1.0` is complete post-V7 minor release lineage',
      '`v7.2.0` is complete narrow stabilization and demo-integrity release lineage.',
      'v6.0.0` was never published as a public package release',
      'Release Train Decision',
      '`v7.1.0`: Previous Shipped Post-V7 Minor',
      '`v7.2.0`: Shipped Stabilization And Demo Integrity',
      '`v8.0.0`: Runtime Graph And Scene IR Product Contract',
      '`v8.1.0`: Replay, Capture, And Render Witnesses',
      '`v8.2.0`: Quality Automation And Method Hardening',
      '`v9.0.0`: Product Workbench And Operator Surfaces',
      '`v10.0.0`: Renderer And Host Systems Integration',
      '| `v7.2.0` | [v7.2.0](https://github.com/flyingrobots/bijou/milestone/5) | 0 | 19 |',
      '| `v8.0.0` | [v8.0.0](https://github.com/flyingrobots/bijou/milestone/6) | 1 | 4 |',
      '| `v8.1.0` | [v8.1.0](https://github.com/flyingrobots/bijou/milestone/7) | 13 | 0 |',
      '| `v8.2.0` | [v8.2.0](https://github.com/flyingrobots/bijou/milestone/8) | 22 | 5 |',
      '| `v9.0.0` | [v9.0.0](https://github.com/flyingrobots/bijou/milestone/9) | 20 | 0 |',
      '| `v10.0.0` | [v10.0.0](https://github.com/flyingrobots/bijou/milestone/10) | 9 | 1 |',
      '| `v7.1.0` | [v7.1.0](https://github.com/flyingrobots/bijou/milestone/4) | 0 | 4 |',
      '`Beyond`',
      '0 | 6',
    ]);
  });

  it('keeps the broad issue 302 tracker on the v8 side of the release train', () => {
    const roadmap = read('docs/ROADMAP.md');
    const goalposts = sectionBetween(
      roadmap,
      '## Forward Goalposts',
      '## Decision Points',
    );
    const row = (release: string) =>
      goalposts.split('\n').find((line) => line.startsWith(`| \`${release}\` |`)) ?? '';
    expectClaims(row('v7.1.0'), [
      'issues/329',
      'issues/270',
      'issues/312',
    ]);
    expect(row('v7.1.0')).not.toContain('issues/302');
    expectClaims(row('v7.2.0'), ['issues/354', 'issues/344', 'issues/353']);
    expectClaims(row('v8.0.0'), ['issues/302', 'issues/482']);
    expect(row('v8.2.0')).not.toContain('pull/467');
    expect(roadmap).toContain('pull/467');
    expect(normalized('docs/ROADMAP.md')).toContain(
      'keep parent #302 in the active `v8.0.0` Runtime Graph horizon',
    );
  });

  it('keeps staged v8 tracker details and sync commands aligned to the milestone', () => {
    const roadmap = read('docs/ROADMAP.md');
    const v8 = sectionBetween(
      roadmap,
      '### `v8.0.0`: Runtime Graph And Scene IR Product Contract',
      '### `v8.1.0`: Replay, Capture, And Render Witnesses',
    );
    const maintenance = sectionBetween(
      roadmap,
      '## Maintenance Rule',
      'When roadmap triage changes:',
    );
    expectClaims(normalizedText(v8), [
      'issues/457',
      'TRACKER: VISOR warpspace for v8 Runtime Graph And Scene IR',
      'issues/458',
      'VISOR: emit GraphQL block artifact bundle with replay and visual scene facts',
      'DX-049-visor-artifact-bundle-proof.md',
      'first `visor-artifact-bundle/1` proof',
      'issues/459',
      'VISOR: validate packed-bijou-cells/1 and adapt to Surface',
      'issues/302',
      'as the broad GraphQL-authored UI scenes into Bijou Blocks source tracker',
    ]);
    expect(v8).not.toContain(
      '- [#302](https://github.com/flyingrobots/bijou/issues/302) for GraphQL-authored',
    );
    expectClaims(maintenance, [
      'gh issue list --state all --milestone v8.0.0',
      'gh pr list --state all --search \'milestone:"v8.0.0"\'',
    ]);
  });

  it('keeps the Beyond open snapshot count aligned with the Open Beyond Issues table', () => {
    const roadmap = read('docs/ROADMAP.md');
    const row = /\| `Beyond` \| \[Beyond\]\([^)]+\) \| (?<open>\d+) \| (?<closed>\d+) \|/.exec(roadmap);
    const openIssues = sectionBetween(
      roadmap,
      '## Open Beyond Issues',
      '## Open Unmilestoned Triage',
    )
      .split('\n')
      .filter((line) => /^\| \[#\d+\]\(https:\/\/github\.com\/flyingrobots\/bijou\/issues\/\d+\)/.test(line));
    expect(row?.groups?.closed).toBe('6');
    expect(Number(row?.groups?.open)).toBe(openIssues.length);
  });
});

function normalizedText(source: string): string {
  return source.replace(/\s+/g, ' ').trim();
}
