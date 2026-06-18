import type { GroupFieldResult } from './types.js';

/** Maximum number of wizard steps before throwing to prevent infinite loops. */
const MAX_WIZARD_STEPS = 1000;

type MaybePromise<T> = T | Promise<T>;
type WizardField<T, K extends keyof T> = (values: Partial<T>) => MaybePromise<T[K]>;
type NoWizardTransform = ReturnType<() => void>;
type WizardTransform<T, K extends keyof T> =
  (values: Partial<T>) => WizardField<T, K> | NoWizardTransform;

/**
 * Single step in a multi-step wizard form.
 *
 * @typeParam T - Record type of the wizard's accumulated values.
 * @typeParam K - Key within T that this step populates.
 */
export interface WizardStep<T, K extends keyof T = keyof T> {
  /** Key in the result record where this step's value is stored. */
  key: K;
  /** Field function that receives previously collected values and returns this step's value. */
  field: WizardField<T, K>;
  /** Predicate that, when returning `true`, causes this step to be skipped. */
  skip?: (values: Partial<T>) => boolean;
  /**
   * Called before `field()`. May return a replacement field function
   * (which will be called instead of the original `field`), or void
   * to keep the original.
   */
  transform?: WizardTransform<T, K>;
  /**
   * Called after value collection. Returns additional steps to splice
   * in immediately after the current step.
   */
  branch?: (values: Partial<T>) => WizardStep<T>[];
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
  const values: Partial<T> = {};
  const steps = [...options.steps];

  let i = 0;
  let iterations = 0;
  while (i < steps.length) {
    if (++iterations > MAX_WIZARD_STEPS) {
      throw new Error(`Wizard exceeded ${String(MAX_WIZARD_STEPS)} steps — possible infinite loop`);
    }
    const step = steps[i];
    if (step == null) break;

    // Skip check
    if (step.skip?.(values)) {
      i++;
      continue;
    }

    // Transform: may replace the field function
    let fieldFn = step.field;
    if (step.transform) {
      const replacement = step.transform(values);
      if (replacement) {
        fieldFn = replacement;
      }
    }

    // Collect value
    const result = await fieldFn(values);
    values[step.key] = result;

    // Branch: splice in additional steps after current position
    if (step.branch) {
      const branchSteps = step.branch(values);
      if (branchSteps.length > 0) {
        steps.splice(i + 1, 0, ...branchSteps);
      }
    }

    i++;
  }

  assertCollectedWizardValues(values);
  return { values, cancelled: false };
}

function assertCollectedWizardValues<T extends Record<string, unknown>>(
  _values: Partial<T>,
): asserts _values is T {
  // Preserve the historical GroupFieldResult<T> return contract; skipped steps
  // may still leave keys absent at runtime.
  void _values;
  return;
}
