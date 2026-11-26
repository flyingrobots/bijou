import { describe, expect, it } from 'vitest';
import { buildRuntimeImportGraph } from './code-dojo-runtime-import-graph.js';
import { buildRuntimeSccInventory, type RuntimeSccInventory } from './code-dojo-runtime-scc.js';
import { compareRuntimeSccInventories } from './code-dojo-runtime-scc-ratchet.js';
import { importing, memoryTree, type FixtureFiles } from './code-dojo-runtime-scc-fixture.js';

const A = 'scripts/a.ts';
const B = 'scripts/b.ts';
const C = 'scripts/c.ts';
const D = 'scripts/d.ts';

function inventory(files: FixtureFiles): RuntimeSccInventory {
  return buildRuntimeSccInventory(buildRuntimeImportGraph(memoryTree(files)));
}

const pairAB = { [A]: importing('./b.js'), [B]: importing('./a.js') };
const pairCD = { [C]: importing('./d.js'), [D]: importing('./c.js') };
const tripleABC = { [A]: importing('./b.js'), [B]: importing('./c.js'), [C]: importing('./a.js') };

describe('runtime SCC ratchet comparison', () => {
  it('holds when the current inventory equals the baseline', () => {
    expect(compareRuntimeSccInventories(inventory(tripleABC), inventory(tripleABC))).toEqual([]);
  });

  it('fails a new component that shares no module with the baseline', () => {
    expect(compareRuntimeSccInventories(inventory(pairAB), inventory({ ...pairAB, ...pairCD }))).toEqual([
      { code: 'new-component', component: C, baseline: [], addedModules: [C, D], addedEdges: [[C, D], [D, C]] },
    ]);
  });

  it('fails a component that grows by a module', () => {
    expect(compareRuntimeSccInventories(inventory(pairAB), inventory({ ...tripleABC, [A]: importing('./b.js') }))).toEqual([
      { code: 'grown-component', component: A, baseline: [A], addedModules: [C], addedEdges: [[B, C], [C, A]] },
    ]);
  });

  it('fails a new edge inside an existing component with the same modules', () => {
    const before = inventory(tripleABC);
    const after = inventory({ ...tripleABC, [A]: importing('./b.js', './c.js') });

    expect(compareRuntimeSccInventories(before, after)).toEqual([
      { code: 'new-edge', component: A, baseline: [A], addedModules: [], addedEdges: [[A, C]] },
    ]);
  });

  it('fails two baseline components merging into one', () => {
    const merged = { ...pairAB, ...pairCD, [B]: importing('./a.js', './c.js'), [D]: importing('./c.js', './a.js') };

    expect(compareRuntimeSccInventories(inventory({ ...pairAB, ...pairCD }), inventory(merged))).toEqual([
      { code: 'merged-components', component: A, baseline: [A, C], addedModules: [], addedEdges: [[B, C], [D, A]] },
    ]);
  });

  it('allows a component that shrinks, splits or disappears', () => {
    const before = inventory({
      ...pairAB, ...pairCD, [B]: importing('./a.js', './c.js'), [D]: importing('./c.js', './a.js'),
    });

    expect(compareRuntimeSccInventories(before, inventory({ ...pairAB, ...pairCD }))).toEqual([]);
    expect(compareRuntimeSccInventories(before, inventory(pairAB))).toEqual([]);
    expect(compareRuntimeSccInventories(before, inventory({ [A]: importing('./b.js'), [B]: '' }))).toEqual([]);
  });
});
