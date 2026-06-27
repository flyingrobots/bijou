import type { ColorDefinition, TokenDefinition } from './graph-types.js';
import { isTokenDefinition } from './graph-guards.js';

export function collectGraphDefinitionDependencies(def: ColorDefinition | TokenDefinition): readonly string[] {
  const deps = new Set<string>();
  if (isTokenDefinition(def)) {
    collectColorDependencies(def.fg, deps);
    if (def.bg !== undefined) collectColorDependencies(def.bg, deps);
  } else {
    collectColorDependencies(def, deps);
  }
  return [...deps];
}

function collectColorDependencies(def: ColorDefinition, deps: Set<string>): void {
  if (typeof def === 'string') return;
  if ('ref' in def) {
    deps.add(def.ref);
    for (const transform of def.transform ?? []) {
      if (transform.type === 'mix') deps.add(transform.with);
    }
  } else if ('light' in def) {
    collectColorDependencies(def.light, deps);
    collectColorDependencies(def.dark, deps);
  }
}
