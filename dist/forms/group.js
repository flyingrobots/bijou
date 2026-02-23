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
export async function group(fields) {
    const values = {};
    for (const key of Object.keys(fields)) {
        const fieldFn = fields[key];
        values[key] = await fieldFn();
    }
    return { values, cancelled: false };
}
//# sourceMappingURL=group.js.map