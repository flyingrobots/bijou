import { describe, it, expect } from 'vitest';
import { multiselect } from './multiselect.js';
import { createTestContext, COLOR_OPTIONS } from '../../adapters/test/index.js';

describe('multiselect()', () => {
  it('accepts ctx parameter', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['1'] } });
      const result = await multiselect({ title: 'X', options: COLOR_OPTIONS, ctx });
      expect(result).toEqual(['red']);
      expect(ctx.io.written.length).toBeGreaterThan(0);
    });

  it('single selection works', async () => {
      const ctx = createTestContext({ mode: 'static', io: { answers: ['2'] } });
      const result = await multiselect({ title: 'Colors', options: COLOR_OPTIONS, ctx });
      expect(result).toEqual(['green']);
    });

  it('all selections work', async () => {
      const ctx = createTestContext({ mode: 'static', io: { answers: ['1,2,3'] } });
      const result = await multiselect({ title: 'Colors', options: COLOR_OPTIONS, ctx });
      expect(result).toEqual(['red', 'green', 'blue']);
    });
});
