import {
  compareEdges, type RuntimeImportEdge, type RuntimeSccComponent, type RuntimeSccInventory,
} from './code-dojo-runtime-scc.js';

/**
 * Why a current component breaks the hold-or-shrink rule.
 * - `new-component`: none of its modules is in any baseline component.
 * - `merged-components`: its modules come from two or more baseline components.
 * - `grown-component`: it lies in one baseline component but adds modules to it.
 * - `new-edge`: its modules are within one baseline component, but it has an
 *   internal edge that component did not record.
 */
export type RuntimeSccViolationCode = 'new-component' | 'merged-components' | 'grown-component' | 'new-edge';

export interface RuntimeSccViolation {
  readonly code: RuntimeSccViolationCode;
  /** The current component's id. */
  readonly component: string;
  /** Ids of the baseline components that share a module with it, sorted. */
  readonly baseline: readonly string[];
  /** Its modules that are in none of those baseline components. */
  readonly addedModules: readonly string[];
  /** Its internal edges that none of those baseline components recorded. */
  readonly addedEdges: readonly RuntimeImportEdge[];
}

const edgeKey = (edge: RuntimeImportEdge): string => `${edge[0]}\0${edge[1]}`;

function violationOf(
  component: RuntimeSccComponent,
  hits: readonly RuntimeSccComponent[],
): RuntimeSccViolation | undefined {
  const knownModules = new Set(hits.flatMap((hit) => hit.modules));
  const knownEdges = new Set(hits.flatMap((hit) => hit.edges.map(edgeKey)));
  const addedModules = component.modules.filter((module) => !knownModules.has(module));
  const addedEdges = component.edges.filter((edge) => !knownEdges.has(edgeKey(edge))).sort(compareEdges);
  let code: RuntimeSccViolationCode;
  if (hits.length === 0) code = 'new-component';
  else if (hits.length > 1) code = 'merged-components';
  else if (addedModules.length > 0) code = 'grown-component';
  else if (addedEdges.length > 0) code = 'new-edge';
  else return undefined;
  return { code, component: component.id, baseline: hits.map((hit) => hit.id), addedModules, addedEdges };
}

/**
 * Judges the current inventory against the checked-in baseline. Shrinking,
 * splitting and disappearing components are not violations; whether the file
 * is then stale is a separate byte comparison made by the command.
 */
export function compareRuntimeSccInventories(
  baseline: RuntimeSccInventory,
  current: RuntimeSccInventory,
): readonly RuntimeSccViolation[] {
  const owner = new Map<string, RuntimeSccComponent>();
  for (const component of baseline.components) {
    for (const module of component.modules) owner.set(module, component);
  }
  return current.components.flatMap((component) => {
    const hits = [...new Set(component.modules.flatMap((module) => {
      const hit = owner.get(module);
      return hit == null ? [] : [hit];
    }))].sort((a, b) => (a.id < b.id ? -1 : 1));
    const violation = violationOf(component, hits);
    return violation == null ? [] : [violation];
  });
}
