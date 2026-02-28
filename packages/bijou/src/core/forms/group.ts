import type { GroupFieldResult } from './types.js';

/**
 * Async factory that produces a single field value.
 *
 * @typeParam T - Type of the value produced.
 */
type FieldFn<T> = () => Promise<T>;

/**
 * Chain multiple form fields together, collecting results into an object.
 *
 * Fields are executed sequentially in key order. Each field function runs
 * independently and its return value is stored under the corresponding key.
 *
 * @typeParam T - Record type mapping field keys to their value types.
 * @param fields - Map of field keys to async factory functions.
 * @returns A {@link GroupFieldResult} containing all collected values.
 *
 * @example
 * ```ts
 * const result = await group({
 *   name: () => input({ title: 'Name', required: true }),
 *   role: () => select({ title: 'Role', options: [...] }),
 *   confirm: () => confirm({ title: 'Continue?' }),
 * });
 * ```
 */
export async function group<T extends Record<string, unknown>>(
  fields: { [K in keyof T]: FieldFn<T[K]> },
): Promise<GroupFieldResult<T>> {
  const values = {} as T;

  for (const key of Object.keys(fields) as Array<keyof T>) {
    const fieldFn = fields[key];
    values[key] = await fieldFn();
  }

  return { values, cancelled: false };
}
