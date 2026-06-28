import type { TokenInput, TokenDefinitions } from './graph-types.js';
import type { StoredDefinition } from './graph-guards.js';
import { isNestedDefinitions, isTokenValue } from './graph-guards.js';

export function importTokenDefinitions(
  definitions: Map<string, StoredDefinition>,
  defs: TokenDefinitions,
  basePath = '',
): void {
  for (const [key, value] of Object.entries(defs)) {
    const fullPath = basePath ? `${basePath}.${key}` : key;

    if (isTokenValue(value)) {
      setTokenDefinition(definitions, fullPath, value);
    } else if (isNestedDefinitions(value)) {
      importTokenDefinitions(definitions, value, fullPath);
    } else {
      definitions.set(fullPath, value);
    }
  }
}

export function setTokenDefinition(
  definitions: Map<string, StoredDefinition>,
  path: string,
  definition: TokenInput,
): void {
  if (isTokenValue(definition)) {
    definitions.set(path, {
      fg: definition.hex,
      bg: definition.bg,
      modifiers: definition.modifiers,
      fgRGB: definition.fgRGB,
      bgRGB: definition.bgRGB,
    });
  } else {
    definitions.set(path, definition);
  }
}
