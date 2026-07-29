import { describe, it } from 'vitest';
import {
  expectClaims,
  expectNoClaims,
  normalized,
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
      'The Code Dojo ratchet [#469](https://github.com/flyingrobots/bijou/issues/469) has met its contract: aggregate debt is `112`, comprising `86` file/context and `26` code-size violations with no mock-ban or ESLint debt. The next goalpost ceiling is `62`.',
      'The immediate target is now [#468](https://github.com/flyingrobots/bijou/issues/468)',
      '`v7.2.0` completed as a narrow stabilization and demo-integrity release',
      '`v7.2.0` milestone is complete release lineage: 0 open and 19 closed milestone items',
      '`v8.0.0` milestone is the active feature horizon: 3 open and 1 closed milestone items',
      '`v8.1.0` milestone is replay, capture, debugger, and render-witness follow-through',
      '`v8.2.0` milestone is quality automation and Method hardening',
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
});
