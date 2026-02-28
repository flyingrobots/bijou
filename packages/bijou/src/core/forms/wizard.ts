import type { GroupFieldResult } from './types.js';

/**
 * Single step in a multi-step wizard form.
 *
 * @typeParam T - Record type of the wizard's accumulated values.
 * @typeParam K - Key within T that this step populates.
 */
export interface WizardStep<T, K extends keyof T = keyof T> {
  /** Key in the result record where this step's value is stored. */
  key: K;
  /** Async field function that receives previously collected values and returns this step's value. */
  field: (values: Partial<T>) => Promise<T[K]>;
  /** Predicate that, when returning `true`, causes this step to be skipped. */
  skip?: (values: Partial<T>) => boolean;
}

/**
 * Configuration for a multi-step wizard form.
 *
 * @typeParam T - Record type of the wizard's accumulated values.
 */
export interface WizardOptions<T extends Record<string, unknown>> {
  /** Ordered list of wizard steps to execute. */
  steps: WizardStep<T>[];
}

/**
 * Multi-step form wizard that runs steps sequentially, passing accumulated
 * values to each step's `field` function. Steps can be conditionally skipped
 * via the `skip` predicate.
 *
 * @typeParam T - Record type mapping step keys to their value types.
 * @param options - Wizard configuration containing the ordered step list.
 * @returns A {@link GroupFieldResult} containing all collected values.
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
