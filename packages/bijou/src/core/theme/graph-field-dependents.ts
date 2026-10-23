import type { ThemeMode } from './graph.js';
import type { TokenDefinitions } from './graph-types.js';
import { isTokenDefinition, type StoredDefinition } from './graph-guards.js';
import { importTokenDefinitions } from './graph-import.js';
import { collectGraphDefinitionDependencies } from './graph-dependencies.js';

/** Keep foreground and background nodes separate until traversal completes. */
export function collectFieldDependents(
  definitions: TokenDefinitions,
  mode: ThemeMode,
): { readonly dependents: ReadonlyMap<string, readonly string[]>; readonly backgrounds: ReadonlySet<string> } {
  const fields = new Map<string, StoredDefinition>();
  importTokenDefinitions(fields, definitions);
  const backgrounds = new Set<string>();
  for (const [path, definition] of [...fields]) {
    if (!isTokenDefinition(definition)) continue;
    fields.set(path, definition.fg);
    if (definition.bg !== undefined && !fields.has(`${path}.bg`)) {
      fields.set(`${path}.bg`, definition.bg);
      backgrounds.add(`${path}.bg`);
    }
  }

  const dependents = new Map<string, string[]>();
  for (const [path, definition] of fields) {
    for (const input of collectGraphDefinitionDependencies(definition, mode, fields)) {
      const consumers = dependents.get(input) ?? [];
      if (!consumers.includes(path)) consumers.push(path);
      dependents.set(input, consumers);
    }
  }
  return { dependents, backgrounds };
}
