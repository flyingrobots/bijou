import type { GroupFieldResult } from './types.js';
type FieldFn<T> = () => Promise<T>;
/**
 * Chain multiple form fields together, collecting results into an object.
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
export declare function group<T extends Record<string, unknown>>(fields: {
    [K in keyof T]: FieldFn<T[K]>;
}): Promise<GroupFieldResult<T>>;
export {};
//# sourceMappingURL=group.d.ts.map