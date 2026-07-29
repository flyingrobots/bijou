import { sha256Text } from './sha256-text.js';

export function stableJsonStringify(value: unknown, contract: string): string {
  const normalized = normalizeStableJson(value, contract);
  if (normalized === undefined) {
    throw new Error(`${contract} JSON value cannot be top-level undefined`);
  }
  return JSON.stringify(normalized);
}

export function hashStableJson(value: unknown, contract: string): string {
  return sha256Text(stableJsonStringify(value, contract));
}

function normalizeStableJson(value: unknown, contract: string): unknown {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`${contract} JSON value must be finite; got ${String(value)}`);
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeStableJson(item, contract));
  }
  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    const entries = Object.entries(value).sort(([left], [right]) => (
      left < right ? -1 : left > right ? 1 : 0
    ));
    for (const [key, raw] of entries) {
      const normalized = normalizeStableJson(raw, contract);
      if (normalized !== undefined) {
        output[key] = normalized;
      }
    }
    return output;
  }
  throw new Error(`${contract} JSON value cannot contain ${typeof value}`);
}
