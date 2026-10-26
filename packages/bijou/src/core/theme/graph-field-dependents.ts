import type { ThemeMode } from './graph.js';
import type { TokenDefinitions } from './graph-types.js';
import { isTokenDefinition, type StoredDefinition } from './graph-guards.js';
import { importTokenDefinitions } from './graph-import.js';
import { collectGraphDefinitionDependencies } from './graph-dependencies.js';

export type FieldDependent = string | { readonly owner: string };

/** Keep foreground and background nodes separate until traversal completes. */
export function collectFieldDependents(
  definitions: TokenDefinitions,
  mode: ThemeMode,
): {
  readonly dependents: ReadonlyMap<string, readonly FieldDependent[]>;
  readonly backgrounds: ReadonlyMap<string, string>;
} {
  const authored = new Map<string, StoredDefinition>();
  importTokenDefinitions(authored, definitions);
  const fields = new Map<FieldDependent, StoredDefinition>(authored);
  const backgrounds = new Map<string, string>();
  for (const [path, definition] of authored) {
    if (!isTokenDefinition(definition)) continue;
    fields.set(path, definition.fg);
    if (definition.bg !== undefined) {
      const backgroundPath = `${path}.bg`;
      if (authored.has(backgroundPath)) {
        fields.set(Object.freeze({ owner: path }), definition.bg);
      } else {
        fields.set(backgroundPath, definition.bg);
        backgrounds.set(backgroundPath, path);
      }
    }
  }

  const dependents = new Map<string, FieldDependent[]>();
  for (const [path, definition] of fields) {
    for (const input of collectGraphDefinitionDependencies(definition, mode, authored)) {
      const consumers = dependents.get(input) ?? [];
      if (!consumers.includes(path)) consumers.push(path);
      dependents.set(input, consumers);
    }
  }
  return { dependents, backgrounds };
}
