import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  extractBashCommandBlocks,
  extractReferencedTestPaths,
  expectClaims,
  expectNoClaims,
  expectOrderedClaims,
  normalized,
  read,
  ROOT,
} from './roadmap-goalpost-policy.test-support.js';

describe('WF-130 roadmap pull order', () => {
  it('binds the completed Dojo prerequisite and complete downstream order', () => {
    const roadmap = normalized('docs/ROADMAP.md');
    const bearing = normalized('docs/BEARING.md');

    expectClaims(roadmap, [
      'Next Pull',
      '[#477](https://github.com/flyingrobots/bijou/issues/477) has met the `112 -> 62` goalpost.',
      'Its landed tranche A [#475](https://github.com/flyingrobots/bijou/pull/475) and landed tranche B [#478](https://github.com/flyingrobots/bijou/pull/478) each removed `25` counted violations.',
      'The bounded Profunctor Page inspection story [#468](https://github.com/flyingrobots/bijou/issues/468) is active in [#474](https://github.com/flyingrobots/bijou/pull/474).',
      '[`DX-048`](./design/DX-048-v8-runtime-graph-scene-ir-contract.md)',
      'Runtime Graph And Scene IR Product Contract',
      'VISOR',
      '#335 release-story surfaces implemented',
      'versioned artifact semantics',
      'DOGFOOD fixtures that round-trip',
      'Forward Goalposts',
      'Decision Points',
      'Demo Integrity And Framework Input Stabilization',
      'Product Workbench And Operator Surfaces',
      'Theme Lab and Theme Inspector provenance',
      'localization workbench proof',
      'Renderer And Host Systems Integration',
      'terminal shader, raster, and native-render foundations',
    ]);
    expectOrderedClaims(bearing, [
      'Recommended pull order:',
      '1. Land the bounded Profunctor Page inspection proof in #468.',
      '2. Treat #458 as landed v8 foundation: the GraphQL block artifact bundle, replay facts, and visual scene facts are implemented.',
      '3. Pull #459 as the next v8 implementation proof: validate `packed-bijou-cells/1` and adapt it to `Surface`.',
      '4. Keep #302 in `v8.0.0` as the broad source tracker while landed #458 and active #459 prove the smallest stable contract.',
      '5. Use `v8.1.0` for replay, capture, debugger, render-witness, and graph proof follow-through after V8 lands.',
      '6. Use `v8.2.0` for Code Dojo, Method, tracker-sync, and fixture-backed quality automation.',
      '7. Keep `v9.0.0` for Product Workbench and operator surfaces after V8 stabilizes the source/artifact/IR contract.',
      '8. Keep `v10.0.0` for Geordi/Wesley, renderer, host, shader, raster, and native surface work after the Bijou contracts are proven.',
      '9. Keep closed dependency PR #326 as superseded lineage, not active release work.',
    ]);
    expectNoClaims(roadmap, [
      'No next public release version is selected.',
      'release-readiness validation before tagging',
      'should not tag until release-readiness validation',
      'Design Tokens And Theme Modes',
      'Terminal Input And Host Controls',
      'Workflow, Capture, And CI Determinism',
    ]);
  });

  it('keeps v7.2 release evidence replay commands aligned with split WF-130 proof files', () => {
    const command = extractBashCommandBlocks(
      read('docs/releases/7.2.0/README.md'),
    ).find((block) => block.includes('roadmap-goalpost-policy.part01.test.ts'));
    expectClaims(command ?? '', [
      'tests/cycles/WF-130/roadmap-goalpost-policy.part01.test.ts',
      'tests/cycles/WF-130/roadmap-goalpost-policy.part02.test.ts',
      'tests/cycles/WF-130/roadmap-goalpost-policy.part03.test.ts',
    ]);
  });

  it('keeps v7.2 release evidence test paths replayable from the checkout', () => {
    const paths = extractReferencedTestPaths(
      read('docs/releases/7.2.0/README.md'),
    );
    expect(paths.filter((path) => !existsSync(resolve(ROOT, path)))).toEqual([]);
  });

  it('keeps the v7.2 release packet aligned with release-prep and registry gates', () => {
    const packet = read('docs/releases/7.2.0/README.md');
    const packages = [
      '@flyingrobots/bijou',
      '@flyingrobots/bijou-node',
      '@flyingrobots/bijou-tui',
      '@flyingrobots/bijou-tui-app',
      'create-bijou-tui-app',
      '@flyingrobots/bijou-i18n',
      '@flyingrobots/bijou-i18n-tools',
      '@flyingrobots/bijou-i18n-tools-node',
      '@flyingrobots/bijou-i18n-tools-xlsx',
      '@flyingrobots/bijou-mcp',
    ];
    expectClaims(packet, [
      '## Package And Registry Verification Plan',
      'npm run version 7.2.0',
      'Release Dry Run',
      'releases/tag/v7.2.0',
      'Publish workflow passed on 2026-07-05',
      'npm registry verification passed for every automated package',
      '## Release-Time Registry Snapshot',
      'workflow run `28736930944` completed at `2026-07-05T10:03:04Z`',
      'may report a later `latest` value',
    ]);
    expectNoClaims(packet, [
      'pending final-main release step',
      'verification remain final-main work',
      'The version bump, final release dry run, tag creation',
    ]);
    for (const packageName of packages) {
      expectClaims(packet, [
        `npm view ${packageName} version dist-tags --json`,
        `| \`${packageName}\` | \`7.2.0\` | \`7.2.0\` |`,
      ]);
    }
  });

  it('keeps dev-tooling dependency security in the v7.2 audit replay', () => {
    expectClaims(read('docs/releases/7.2.0/README.md'), [
      'Dev-tooling dependency audit',
      '`npm audit --audit-level=high`',
      '`npm audit --omit=dev --audit-level=high`',
      '`esbuild` resolves to `0.28.1`',
      '`node_modules/esbuild`',
    ]);
  });
});
