import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  expectClaims,
  expectNoClaims,
  normalized,
  read,
  requireRecord,
  ROOT,
  sectionBetween,
} from './roadmap-goalpost-policy.test-support.js';

describe('WF-130 roadmap supporting contracts', () => {
  it('aligns bearing, release, design, and tracker lineage', () => {
    const roadmap = normalized('docs/ROADMAP.md');
    const bearing = normalized('docs/BEARING.md');
    const releaseRunbook = normalized('docs/release.md');
    const dx046Design = normalized(
      'docs/design/DX-046-graphql-authored-dogfood-block-fixture.md',
    );
    const dx048Design = normalized(
      'docs/design/DX-048-v8-runtime-graph-scene-ir-contract.md',
    );

    expectClaims(roadmap, [
      'Open Unmilestoned Triage',
      'No open issue currently lives in `Beyond`',
      'No open issue is currently unmilestoned.',
      'Dependency Security Lineage',
      '[#357]',
      '[#358]',
      '[#326]',
      'was not selected for `v7.1.0`',
      'superseded by issue-backed',
      'The `v7.1.0` GitHub milestone is closed release lineage.',
      'Closed Lineage',
      'Portable `ui-scene-ir/1` proof',
      'Skipped public release; complete lineage',
      'https://github.com/flyingrobots/bijou/issues/270',
      'https://github.com/flyingrobots/bijou/issues/312',
      'https://github.com/flyingrobots/bijou/issues/329',
    ]);
    expectClaims(bearing, [
      'The latest shipped public release is `v7.2.0`',
      'The next feature horizon remains `v8.0.0`',
      '[#477](https://github.com/flyingrobots/bijou/issues/477) has met its `112 -> 62` contract.',
      'Landed tranche A [#475](https://github.com/flyingrobots/bijou/pull/475) and landed tranche B [#478](https://github.com/flyingrobots/bijou/pull/478) each removed `25` counted violations.',
      'Current debt comprises `32` file/context and `20` code-size violations with no mock-ban or ESLint debt.',
      'The bounded target [#468](https://github.com/flyingrobots/bijou/issues/468) landed through [#474](https://github.com/flyingrobots/bijou/pull/474)',
      'The #458 GraphQL block artifact bundle and #459 packed-cell `Surface` adapter have landed',
      '[#480](https://github.com/flyingrobots/bijou/issues/480)',
      '[WF-165](./design/WF-165-respecting-dojo-ratchet-12.md)',
      'Tranche B selects the five smallest remaining double-counted roots and targets `42`.',
      '[RE-036](./design/RE-036-packed-bijou-cells-surface-adapter.md)',
      '`v7.2.0` completed as a narrow stabilization and demo-integrity release',
      '`v7.2.0` milestone is complete release lineage: 0 open and 19 closed milestone items',
      '`v8.0.0` milestone is the active feature horizon: 2 open milestone items and 2 closed milestone items',
      '`v8.1.0` milestone is replay, capture, debugger, and render-witness follow-through',
      '`v8.2.0` milestone is quality automation and Method hardening: 21 open and 2 closed milestone items',
      '[#485](https://github.com/flyingrobots/bijou/issues/485)',
      'No open issue is currently unmilestoned',
      'The selected `v7.2.0` DOGFOOD product pull #335 has landed',
      'Keep Future Releases Explicit',
    ]);
    expectNoClaims(bearing, [
      'final-main tag validation',
      'The next selected product pull after that gate is DX-047',
      'The next release-facing action is release-readiness validation',
    ]);
    expectClaims(releaseRunbook, [
      'The latest shipped release is **`7.2.0`**.',
      '`8.0.0` is the next feature horizon',
      'New feature work should shape toward `8.0.0`',
    ]);
    expectNoClaims(releaseRunbook, [
      'No next public release version is selected',
    ]);
    expectClaims(dx046Design, [
      'User story: [#329](https://github.com/flyingrobots/bijou/issues/329)',
      'Parent tracker: [#302](https://github.com/flyingrobots/bijou/issues/302)',
      'NavigationListBlock',
      'Tests To Write First',
    ]);
    expectClaims(dx048Design, [
      'Goalpost tracker: [#457](https://github.com/flyingrobots/bijou/issues/457)',
      'GraphQL Blocks source model',
      '`bijou-block/1` artifact semantics',
      '`ui-scene-ir/1` lowering contract',
      'receipt and source-map ownership',
      'DOGFOOD round-trip fixture',
      '[flyingrobots/visor](https://github.com/flyingrobots/visor)',
    ]);
    expectNoClaims(dx048Design, [
      'VISOR coordination surface: https://github.com/flyingrobots/visor',
    ]);
  });

  it('disables Markdown line-length linting for project docs', () => {
    const config = requireRecord(JSON.parse(read('.markdownlint.json')));
    expect(config.MD013).toBe(false);
    expect(config['line-length']).toBe(false);
  });

  it('publishes discoverable v7.2 release docs for the versioned package set', () => {
    for (const path of [
      'docs/releases/7.2.0/README.md',
      'docs/releases/7.2.0/whats-new.md',
      'docs/releases/7.2.0/migration-guide.md',
    ]) {
      expect(existsSync(resolve(ROOT, path)), path).toBe(true);
    }
    expectClaims(read('docs/releases/README.md'), [
      '[Release Evidence (v7.2.0)](./7.2.0/README.md)',
      '[What\'s New (v7.2.0)](./7.2.0/whats-new.md)',
      '[Migration Guide (v7.2.0)](./7.2.0/migration-guide.md)',
    ]);
  });

  it('links the #458 VISOR artifact bundle cycle to DX-049', () => {
    const path = 'docs/design/DX-049-visor-artifact-bundle-proof.md';
    const source = read(path);
    expect(existsSync(resolve(ROOT, path))).toBe(true);
    expectClaims(normalized('docs/ROADMAP.md'), [
      '[`DX-049`](./design/DX-049-visor-artifact-bundle-proof.md)',
      '`visor-artifact-bundle/1` proof',
    ]);
    expectClaims(normalized('docs/BEARING.md'), [
      'Their cycle designs remain [DX-049](./design/DX-049-visor-artifact-bundle-proof.md)',
    ]);
    expectClaims(normalizeSource(source), [
      'User story: [#458](https://github.com/flyingrobots/bijou/issues/458)',
      'V8 tracker: [#457](https://github.com/flyingrobots/bijou/issues/457)',
      '`visor-artifact-bundle/1`',
      '`bijou-block/1`',
      '`ui-scene-ir/1`',
      'replay metadata',
      'visual scene facts',
      'Tests To Write First',
    ]);
    expect(sectionBetween(source, '## Non-Goals', '## Bundle Contract'))
      .toContain('implement #459 packed-cell-to-`Surface` validation');
  });
});

function normalizeSource(source: string): string {
  return source.replace(/\s+/g, ' ').trim();
}
