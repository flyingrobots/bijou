export function must<T>(value: T | undefined, what = 'state'): T {
  if (value === undefined) throw new Error(`Timeline: missing ${what}`);
  return value;
}
