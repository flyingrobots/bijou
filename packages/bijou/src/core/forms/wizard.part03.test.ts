import { describe, it, expect } from 'vitest';
import { wizard, type WizardStep } from './wizard.js';

describe('wizard()', () => {
  it('throws when exceeding max iteration guard', async () => {
      // Each step branches a copy of itself, creating unbounded growth
      const selfBranchingStep: WizardStep<{ n: number }> = {
        key: 'n',
        field: () => 1,
        branch: () => [selfBranchingStep],
      };

      await expect(
        wizard<{ n: number }>({ steps: [selfBranchingStep] }),
      ).rejects.toThrow('exceeded 1000 steps');
    });

  it('skip predicate can depend on multiple prior values', async () => {
      const result = await wizard<{ x: number; y: number; sum: number }>({
        steps: [
          { key: 'x', field: () => 5 },
          { key: 'y', field: () => 10 },
          {
            key: 'sum',
            field: (vals) => (vals.x ?? 0) + (vals.y ?? 0),
            skip: (vals) => (vals.x ?? 0) + (vals.y ?? 0) > 20,
          },
        ],
      });
      expect(result.values.sum).toBe(15);
    });
});
