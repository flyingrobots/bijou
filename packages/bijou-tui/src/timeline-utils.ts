export function must<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Timeline: missing state');
  return value;
}
