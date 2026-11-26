import type { RuntimeImportGraph } from './code-dojo-runtime-import-graph.js';

export const RUNTIME_SCC_INVENTORY_SCHEMA = 'code-dojo.runtime-scc-inventory.v1';

export type RuntimeImportEdge = readonly [from: string, to: string];

/** One cyclic strongly connected component: two or more modules, or one module that imports itself. */
export interface RuntimeSccComponent {
  /** Stable identity: the first module in sorted order. */
  readonly id: string;
  /** `packages/<name>` or `examples/<name>` for those trees, else the top-level directory. */
  readonly area: string;
  readonly modules: readonly string[];
  /** Every runtime edge whose two ends are both in this component, sorted. */
  readonly edges: readonly RuntimeImportEdge[];
}

export interface RuntimeSccInventory {
  readonly schema: typeof RUNTIME_SCC_INVENTORY_SCHEMA;
  readonly componentCount: number;
  readonly moduleCount: number;
  readonly components: readonly RuntimeSccComponent[];
}

interface Frame {
  readonly node: string;
  next: number;
}

/** Tarjan's algorithm, iterative so deep import chains cannot overflow the stack. */
export function stronglyConnectedComponents(graph: RuntimeImportGraph): string[][] {
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const components: string[][] = [];
  const enter = (node: string, work: Frame[]): void => {
    index.set(node, index.size);
    low.set(node, index.size - 1);
    stack.push(node);
    onStack.add(node);
    work.push({ node, next: 0 });
  };
  const lower = (node: string, value: number): void => {
    low.set(node, Math.min(low.get(node) ?? value, value));
  };

  for (const root of [...graph.keys()].sort()) {
    if (index.has(root)) continue;
    const work: Frame[] = [];
    enter(root, work);
    for (let frame = work.at(-1); frame != null; frame = work.at(-1)) {
      const target = (graph.get(frame.node) ?? [])[frame.next];
      if (target != null) {
        frame.next += 1;
        if (!index.has(target)) enter(target, work);
        else if (onStack.has(target)) lower(frame.node, index.get(target) ?? 0);
        continue;
      }
      work.pop();
      const nodeLow = low.get(frame.node) ?? 0;
      const parent = work.at(-1);
      if (parent != null) lower(parent.node, nodeLow);
      if (nodeLow !== index.get(frame.node)) continue;
      const members: string[] = [];
      for (let member = stack.pop(); member != null; member = stack.pop()) {
        onStack.delete(member);
        members.push(member);
        if (member === frame.node) break;
      }
      components.push(members.sort());
    }
  }
  return components.sort((a, b) => compareText(a[0] ?? '', b[0] ?? ''));
}

export function runtimeSccArea(module: string): string {
  const [first = '', second] = module.split('/');
  return (first === 'packages' || first === 'examples') && second != null ? `${first}/${second}` : first;
}

export function compareText(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function compareEdges(a: RuntimeImportEdge, b: RuntimeImportEdge): number {
  return compareText(a[0], b[0]) || compareText(a[1], b[1]);
}

export function inventoryOf(components: readonly RuntimeSccComponent[]): RuntimeSccInventory {
  return {
    schema: RUNTIME_SCC_INVENTORY_SCHEMA,
    componentCount: components.length,
    moduleCount: components.reduce((sum, component) => sum + component.modules.length, 0),
    components,
  };
}

/** The cyclic components of the graph, each with its internal edges. */
export function buildRuntimeSccInventory(graph: RuntimeImportGraph): RuntimeSccInventory {
  const components = stronglyConnectedComponents(graph).flatMap((modules): RuntimeSccComponent[] => {
    const members = new Set(modules);
    const edges = modules.flatMap((from) => (graph.get(from) ?? [])
      .filter((to) => members.has(to))
      .map((to): RuntimeImportEdge => [from, to]))
      .sort(compareEdges);
    const id = modules[0];
    if (id == null || (modules.length === 1 && edges.length === 0)) return [];
    return [{ id, area: runtimeSccArea(id), modules, edges }];
  });
  return inventoryOf(components);
}

/** Canonical bytes: one line per component, so a diff names the component that changed. No timestamps. */
export function serializeRuntimeSccInventory(inventory: RuntimeSccInventory): string {
  const components = inventory.components.map((component) => `    ${JSON.stringify({
    id: component.id,
    area: component.area,
    modules: component.modules,
    edges: component.edges,
  })}`);
  return [
    '{',
    `  "schema": ${JSON.stringify(inventory.schema)},`,
    `  "componentCount": ${String(inventory.componentCount)},`,
    `  "moduleCount": ${String(inventory.moduleCount)},`,
    components.length === 0 ? '  "components": []' : `  "components": [\n${components.join(',\n')}\n  ]`,
    '}',
    '',
  ].join('\n');
}
