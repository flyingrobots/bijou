import { describe, expect, it } from 'vitest';
import { wizard, type WizardStep } from './wizard.js';

describe('wizard() malformed step handling', () => {
  it('throws when the step list contains a missing slot', async () => {
    interface Values extends Record<string, unknown> { first: string; second: string }
    const steps: WizardStep<Values>[] = [{ key: 'first', field: () => 'first' }];
    steps.length = 3;
    steps[2] = { key: 'second', field: () => 'second' };

    await expect(wizard<Values>({ steps })).rejects.toThrow('Wizard step 1 is missing');
  });
});
