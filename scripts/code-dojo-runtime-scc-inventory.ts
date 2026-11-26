import {
  RUNTIME_SCC_INVENTORY_SCHEMA, runtimeSccArea, stronglyConnectedComponents,
  type RuntimeImportEdge, type RuntimeSccComponent, type RuntimeSccInventory,
} from './code-dojo-runtime-scc.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function strings(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items: unknown[] = value;
  const text = items.filter((item): item is string => typeof item === 'string');
  return text.length === items.length ? text : undefined;
}

function edges(value: unknown): readonly RuntimeImportEdge[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items: unknown[] = value;
  const parsed: RuntimeImportEdge[] = [];
  for (const item of items) {
    const pair = strings(item);
    const [from, to] = pair ?? [];
    if (pair?.length !== 2 || from == null || to == null) return undefined;
    parsed.push([from, to]);
  }
  return parsed;
}

function component(value: unknown): RuntimeSccComponent | undefined {
  if (!isRecord(value)) return undefined;
  const { id, area } = value;
  const modules = strings(value['modules']);
  const internal = edges(value['edges']);
  if (typeof id !== 'string' || typeof area !== 'string' || modules == null || internal == null) return undefined;
  return { id, area, modules, edges: internal };
}

/** Narrows parsed JSON to an inventory, or returns why it is not one. */
export function parseRuntimeSccInventory(value: unknown): RuntimeSccInventory | string {
  if (!isRecord(value) || value['schema'] !== RUNTIME_SCC_INVENTORY_SCHEMA) {
    return `not a ${RUNTIME_SCC_INVENTORY_SCHEMA} document`;
  }
  const { componentCount, moduleCount } = value;
  const list = value['components'];
  if (typeof componentCount !== 'number' || typeof moduleCount !== 'number' || !Array.isArray(list)) {
    return 'componentCount, moduleCount and components are required';
  }
  const items: unknown[] = list;
  const components = items.map(component);
  const valid = components.filter((item): item is RuntimeSccComponent => item != null);
  if (valid.length !== components.length) return 'a component is malformed';
  return { schema: RUNTIME_SCC_INVENTORY_SCHEMA, componentCount, moduleCount, components: valid };
}

const isSorted = (items: readonly string[]): boolean =>
  items.every((item, index) => index === 0 || (items[index - 1] ?? '') < item);

function componentProblems(item: RuntimeSccComponent): string[] {
  const problems: string[] = [];
  const members = new Set(item.modules);
  const edgeKeys = item.edges.map((edge) => `${edge[0]}\0${edge[1]}`);
  if (!isSorted(item.modules)) problems.push('modules are not sorted');
  if (item.id !== [...item.modules].sort()[0]) problems.push('id is not the first module');
  if (item.area !== runtimeSccArea(item.id)) problems.push(`area is not ${runtimeSccArea(item.id)}`);
  if (!isSorted(edgeKeys)) problems.push('edges are not sorted and unique');
  if (item.edges.some(([from, to]) => !members.has(from) || !members.has(to))) {
    problems.push('an edge leaves the component');
  }
  const graph = new Map(item.modules.map((module) => [
    module, item.edges.filter((edge) => edge[0] === module).map((edge) => edge[1]),
  ]));
  const cyclic = item.modules.length > 1 || item.edges.length > 0;
  if (stronglyConnectedComponents(graph).length !== 1 || !cyclic) {
    problems.push('edges do not make the modules one strongly connected component');
  }
  return problems.map((problem) => `${item.id}: ${problem}`);
}

/** Every way the inventory disagrees with itself; empty when it is consistent. */
export function inventoryInconsistencies(inventory: RuntimeSccInventory): readonly string[] {
  const problems: string[] = [];
  const all = inventory.components.flatMap((item) => item.modules);
  if (inventory.componentCount !== inventory.components.length) problems.push('componentCount does not match components');
  if (inventory.moduleCount !== all.length) problems.push('moduleCount does not match components');
  if (new Set(all).size !== all.length) problems.push('a module is in more than one component');
  if (!isSorted(inventory.components.map((item) => item.id))) problems.push('components are not sorted by id');
  return [...problems, ...inventory.components.flatMap(componentProblems)];
}
