import { describe, it } from 'vitest';
import {
  expectClaims,
  expectNoClaims,
  expectOrderedClaims,
  normalized,
} from './roadmap-goalpost-policy.test-support.js';

describe('WF-130 roadmap pull order', () => {
  it('binds the completed Dojo prerequisite and complete downstream order', () => {
    const roadmap = normalized('docs/ROADMAP.md');
    const bearing = normalized('docs/BEARING.md');

    expectClaims(roadmap, [
      'Next Pull',
      'The Code Dojo prerequisite [#469](https://github.com/flyingrobots/bijou/issues/469) has met its `112` aggregate-debt contract. The next repository pull is [#468](https://github.com/flyingrobots/bijou/issues/468)',
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
});
