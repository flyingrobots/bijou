import type { GroupFieldResult } from './types.js';

export interface WizardStep<T, K extends keyof T = keyof T> {
  key: K;
  field: (values: Partial<T>) => Promise<T[K]>;
  skip?: (values: Partial<T>) => boolean;
}

export interface WizardOptions<T extends Record<string, unknown>> {
  steps: WizardStep<T>[];
}

/**
 * Multi-step form wizard that runs steps sequentially, passing accumulated
 * values to each step's `field` function. Steps can be conditionally skipped
 * via the `skip` predicate.
 *
 * @example
 * ```ts
 * const result = await wizard<{ mode: string; details: string }>({
 *   steps: [
 *     { key: 'mode', field: () => select({ title: 'Mode', options: [...] }) },
 *     {
 *       key: 'details',
 *       field: () => input({ title: 'Details' }),
 *       skip: (vals) => vals.mode === 'simple',
 *     },
 *   ],
 * });
 * ```
 */
export async function wizard<T extends Record<string, unknown>>(
  options: WizardOptions<T>,
): Promise<GroupFieldResult<T>> {
  const values = {} as T;

  for (const step of options.steps) {
    if (step.skip?.(values)) {
      continue;
    }

    const result = await step.field(values);
    (values as Record<string, unknown>)[step.key as string] = result;
  }

  return { values, cancelled: false };
}
