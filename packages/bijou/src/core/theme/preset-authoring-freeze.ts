import type { TokenDefinitions } from './graph-types.js';

export function immutableTokenDefinitions(definitions: TokenDefinitions): TokenDefinitions {
  return deepFreeze(structuredClone(definitions));
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value;
  for (const key of Reflect.ownKeys(value)) deepFreeze(Reflect.get(value, key));
  Object.freeze(value);
  return value;
}
