export function text(value: unknown, fallback = ''): string {
  if (
    typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
    || typeof value === 'bigint'
  ) {
    return String(value);
  }
  return fallback;
}

export function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(item => text(item)) : [];
}

export function numbers(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((item): item is number => typeof item === 'number') : [];
}
