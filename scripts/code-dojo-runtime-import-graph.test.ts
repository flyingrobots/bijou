import { describe, expect, it } from 'vitest';
import { buildRuntimeImportGraph } from './code-dojo-runtime-import-graph.js';
import { buildRuntimeSccInventory, serializeRuntimeSccInventory } from './code-dojo-runtime-scc.js';
import { importing, memoryTree, type FixtureFiles } from './code-dojo-runtime-scc-fixture.js';

const P = 'packages/demo/src';

function members(files: FixtureFiles): string[][] {
  const inventory = buildRuntimeSccInventory(buildRuntimeImportGraph(memoryTree(files)));
  return inventory.components.map((component) => [...component.modules]);
}

describe('runtime import graph and SCC inventory', () => {
  it('finds a 2-cycle and a 3-cycle as one component each', () => {
    expect(members({
      [`${P}/a.ts`]: importing('./b.js'),
      [`${P}/b.ts`]: importing('./a.js'),
      [`${P}/c.ts`]: importing('./d.js'),
      [`${P}/d.ts`]: importing('./e.js'),
      [`${P}/e.ts`]: importing('./c.js'),
      [`${P}/leaf.ts`]: importing('./a.js'),
    })).toEqual([[`${P}/a.ts`, `${P}/b.ts`], [`${P}/c.ts`, `${P}/d.ts`, `${P}/e.ts`]]);
  });

  it('keeps two disjoint cycles apart and sorts them by their anchor module', () => {
    const inventory = buildRuntimeSccInventory(buildRuntimeImportGraph(memoryTree({
      'scripts/z1.ts': importing('./z2.js'),
      'scripts/z2.ts': importing('./z1.js'),
      [`${P}/m1.ts`]: importing('./m2.js'),
      [`${P}/m2.ts`]: importing('./m1.js'),
    })));

    expect(inventory.components.map((component) => [component.id, component.area])).toEqual([
      [`${P}/m1.ts`, 'packages/demo'],
      ['scripts/z1.ts', 'scripts'],
    ]);
    expect(inventory.componentCount).toBe(2);
    expect(inventory.moduleCount).toBe(4);
  });

  it('counts an SCC with two distinct DFS cycle paths once, recording every internal edge', () => {
    const inventory = buildRuntimeSccInventory(buildRuntimeImportGraph(memoryTree({
      [`${P}/a.ts`]: importing('./b.js', './c.js'),
      [`${P}/b.ts`]: importing('./a.js'),
      [`${P}/c.ts`]: importing('./a.js'),
    })));

    expect(inventory.componentCount).toBe(1);
    expect(inventory.components[0]?.edges).toEqual([
      [`${P}/a.ts`, `${P}/b.ts`], [`${P}/a.ts`, `${P}/c.ts`], [`${P}/b.ts`, `${P}/a.ts`], [`${P}/c.ts`, `${P}/a.ts`],
    ]);
  });

  it('follows runtime re-exports, export-star and side-effect imports', () => {
    expect(members({
      [`${P}/index.ts`]: "export { a } from './a.js';\n",
      [`${P}/a.ts`]: "import { b } from './star.js';\nexport const a = b;\n",
      [`${P}/star.ts`]: "export * from './side.js';\n",
      [`${P}/side.ts`]: "import './index.js';\nexport const b = 1;\n",
    })).toEqual([[`${P}/a.ts`, `${P}/index.ts`, `${P}/side.ts`, `${P}/star.ts`]]);
  });

  it('does not create an edge for import type, inline type-only specifiers or type-only re-exports', () => {
    expect(members({
      [`${P}/a.ts`]: "import type { B } from './b.js';\nexport const a = 1;\n",
      [`${P}/b.ts`]: "import { type C } from './c.js';\nexport type B = number;\n",
      [`${P}/c.ts`]: "export type { A } from './d.js';\nexport { type X } from './a.js';\n",
      [`${P}/d.ts`]: importing('./a.js'),
    })).toEqual([]);
  });

  it('records a self-import as a one-module component', () => {
    expect(members({ [`${P}/self.ts`]: importing('./self.js') })).toEqual([[`${P}/self.ts`]]);
  });

  it('does not create an edge for a dynamic import(), a package name or an unresolved path', () => {
    expect(members({
      [`${P}/a.ts`]: "import { x } from '@flyingrobots/demo';\nimport { y } from './missing.js';\nexport const a = x + y;\n",
      [`${P}/b.ts`]: "export async function load() { return import('./a.js'); }\n",
      [`${P}/c.ts`]: "export const c = () => import('./b.js');\n",
    })).toEqual([]);
  });

  it('resolves directory index modules and .tsx sources', () => {
    expect(members({
      [`${P}/view.tsx`]: importing('./widgets'),
      [`${P}/widgets/index.ts`]: importing('../view.js'),
    })).toEqual([[`${P}/view.tsx`, `${P}/widgets/index.ts`]]);
  });

  it('serializes identical bytes for any file order', () => {
    const files: FixtureFiles = {
      [`${P}/a.ts`]: importing('./b.js', './c.js'),
      [`${P}/b.ts`]: importing('./c.js', './a.js'),
      [`${P}/c.ts`]: importing('./a.js'),
      'scripts/x.ts': importing('./y.js'),
      'scripts/y.ts': importing('./x.js'),
    };
    const order = Object.keys(files);
    const serialize = (paths: readonly string[]): string =>
      serializeRuntimeSccInventory(buildRuntimeSccInventory(buildRuntimeImportGraph(memoryTree(files, paths))));

    expect(serialize([...order].reverse())).toBe(serialize(order));
    expect(serialize([order[2] ?? '', order[4] ?? '', order[0] ?? '', order[3] ?? '', order[1] ?? ''])).toBe(serialize(order));
  });
});
