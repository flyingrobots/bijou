import { createTokenGraph, type ThemeMode } from './graph.js';
import { collectFieldDependents } from './graph-field-dependents.js';
import type { TokenDefinitions } from './graph-types.js';
import { isNestedDefinitions, isTokenDefinition, isTokenValue } from './graph-guards.js';

/**
 * Every addressable token path in a definition tree, in declaration order.
 *
 * Nested groups are flattened to dotted paths, matching the addressing the
 * token graph itself uses.
 */
export function tokenDefinitionPaths(definitions: TokenDefinitions, basePath = ''): readonly string[] {
  return collectTokenDefinitionPaths(definitions, basePath, false);
}

function tokenDefinitionAddressablePaths(definitions: TokenDefinitions): readonly string[] {
  return collectTokenDefinitionPaths(definitions, '', true);
}

function collectTokenDefinitionPaths(
  definitions: TokenDefinitions,
  basePath: string,
  includeBackgrounds: boolean,
): readonly string[] {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(definitions)) {
    const fullPath = basePath === '' ? key : `${basePath}.${key}`;
    if (!isTokenValue(value) && isNestedDefinitions(value)) {
      paths.push(...collectTokenDefinitionPaths(value, fullPath, includeBackgrounds));
      continue;
    }
    paths.push(fullPath);
    const hasBackground = (isTokenValue(value) || isTokenDefinition(value)) && value.bg !== undefined;
    if (includeBackgrounds && hasBackground) {
      paths.push(`${fullPath}.bg`);
    }
  }
  return paths;
}

/**
 * Map each token path to the paths that consume it.
 *
 * Dependency edges are read back out of the graph rather than declared
 * alongside it, so the result cannot drift from what the theme actually
 * resolves: a token that stops referencing another loses the edge for free,
 * and an edge to a token that does not exist cannot be expressed at all.
 *
 * Edges are mode-sensitive. An adaptive `{ light, dark }` definition depends
 * on whichever branch the requested mode selects, so a light-mode dependents
 * map can legitimately differ from a dark-mode one.
 * Inspection inputs count too: an excluded candidate's color remains visible
 * in provenance. An edge does not guarantee that editing its input changes
 * the selected token value.
 */
export function collectTokenDependents(
  definitions: TokenDefinitions,
  mode: ThemeMode = 'dark',
): ReadonlyMap<string, readonly string[]> {
  const graph = createTokenGraph(definitions);
  const dependents = new Map<string, string[]>();
  const addressablePaths = new Set(tokenDefinitionAddressablePaths(definitions));

  try {
    for (const path of tokenDefinitionPaths(definitions)) {
      for (const dependency of graph.dependencies(path, mode)) {
        if (!addressablePaths.has(dependency)) continue;
        const bucket = dependents.get(dependency) ?? [];
        if (!bucket.includes(path)) bucket.push(path);
        dependents.set(dependency, bucket);
      }
    }
  } finally {
    graph.dispose();
  }

  return dependents;
}

/**
 * Map each token path to every path it ultimately affects.
 *
 * Where {@link collectTokenDependents} reports only direct consumers, this
 * follows the chain of value and inspection inputs. Foreground and background
 * fields are traversed independently: reaching a token's foreground does not
 * imply that its background, or consumers of that background, changed.
 * Virtual fields are projected back to their owning token in the result.
 *
 * Cycles are tolerated. A token is never reported as affecting itself, and a
 * reference loop terminates instead of recursing forever.
 */
export function collectTransitiveTokenDependents(
  definitions: TokenDefinitions,
  mode: ThemeMode = 'dark',
): ReadonlyMap<string, readonly string[]> {
  const { dependents: direct, backgrounds } = collectFieldDependents(definitions, mode);
  const transitive = new Map<string, readonly string[]>();

  for (const path of direct.keys()) {
    const reached = new Set<string>();
    const visited = new Set<string>();
    const queue = [...(direct.get(path) ?? [])];
    while (queue.length > 0) {
      const next = queue.shift();
      if (next === undefined || next === path || visited.has(next)) continue;
      visited.add(next);
      const token = backgrounds.has(next) ? next.slice(0, -3) : next;
      if (token !== path) reached.add(token);
      queue.push(...(direct.get(next) ?? []));
    }
    transitive.set(path, [...reached]);
  }

  return transitive;
}
