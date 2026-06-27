import { isTokenDefinition, type StoredDefinition } from './graph-guards.js';

export function hasThemeRulePath(definitions: ReadonlyMap<string, StoredDefinition>, path: string): boolean {
  if (definitions.has(path)) return true;
  if (!path.endsWith('.bg')) return false;
  const token = definitions.get(path.slice(0, -3));
  return token !== undefined && isTokenDefinition(token) && token.bg !== undefined;
}
