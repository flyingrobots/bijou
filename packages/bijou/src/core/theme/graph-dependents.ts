import { createTokenGraph, type ThemeMode } from './graph.js';
import type { TokenDefinitions } from './graph-types.js';
import { isNestedDefinitions, isTokenValue } from './graph-guards.js';

/**
 * Every addressable token path in a definition tree, in declaration order.
 *
 * Nested groups are flattened to dotted paths, matching the addressing the
 * token graph itself uses.
 */
export function tokenDefinitionPaths(definitions: TokenDefinitions, basePath = ''): readonly string[] {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(definitions)) {
    const fullPath = basePath === '' ? key : `${basePath}.${key}`;
    if (!isTokenValue(value) && isNestedDefinitions(value)) {
      paths.push(...tokenDefinitionPaths(value, fullPath));
    } else {
      paths.push(fullPath);
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
 */
export function collectTokenDependents(
  definitions: TokenDefinitions,
  mode: ThemeMode = 'dark',
): ReadonlyMap<string, readonly string[]> {
  const graph = createTokenGraph(definitions);
  const dependents = new Map<string, string[]>();

  try {
    for (const path of tokenDefinitionPaths(definitions)) {
      for (const dependency of graph.inspect(path, mode).dependencies) {
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
 * follows the chain: `status.success` feeds `semantic.success`, which feeds
 * `border.success`, so editing the first changes all three. That closure is
 * the honest answer to "what moves if I change this", which is the question a
 * theme editor is really asking.
 *
 * Cycles are tolerated. A token is never reported as affecting itself, and a
 * reference loop terminates instead of recursing forever.
 */
export function collectTransitiveTokenDependents(
  definitions: TokenDefinitions,
  mode: ThemeMode = 'dark',
): ReadonlyMap<string, readonly string[]> {
  const direct = collectTokenDependents(definitions, mode);
  const transitive = new Map<string, readonly string[]>();

  for (const path of direct.keys()) {
    const reached = new Set<string>();
    const queue = [...(direct.get(path) ?? [])];
    while (queue.length > 0) {
      const next = queue.shift();
      if (next === undefined || next === path || reached.has(next)) continue;
      reached.add(next);
      queue.push(...(direct.get(next) ?? []));
    }
    transitive.set(path, [...reached]);
  }

  return transitive;
}
