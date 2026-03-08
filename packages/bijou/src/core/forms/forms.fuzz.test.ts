import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { input } from './input.js';
import { confirm } from './confirm.js';
import { select } from './select.js';
import { multiselect } from './multiselect.js';
import { createTestContext, COLOR_OPTIONS } from '../../adapters/test/index.js';

describe('forms fuzz (property-based)', () => {
  describe('input() pipe mode', () => {
    it('never throws on arbitrary string input', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (str) => {
          const ctx = createTestContext({ mode: 'pipe', io: { answers: [str] } });
          const result = await input({ title: 'test', ctx });
          expect(typeof result).toBe('string');
        }),
        { numRuns: 200 },
      );
    });

    it('handles control characters without crashing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 0x00, max: 0x1f }), { minLength: 1, maxLength: 20 })
            .map((codes) => codes.map((c) => String.fromCharCode(c)).join('')),
          async (str) => {
            const ctx = createTestContext({ mode: 'pipe', io: { answers: [str] } });
            const result = await input({ title: 'test', ctx });
            expect(typeof result).toBe('string');
          },
        ),
        { numRuns: 100 },
      );
    });

    it('handles very long input without crashing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1000, max: 5000 }).chain((len) =>
            fc.constant('x'.repeat(len)),
          ),
          async (str) => {
            const ctx = createTestContext({ mode: 'pipe', io: { answers: [str] } });
            const result = await input({ title: 'test', ctx });
            expect(result.length).toBeGreaterThan(0);
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('confirm() pipe mode', () => {
    it('always returns boolean on arbitrary input', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (str) => {
          const ctx = createTestContext({ mode: 'pipe', io: { answers: [str] } });
          const result = await confirm({ title: 'test', ctx });
          expect(typeof result).toBe('boolean');
        }),
        { numRuns: 200 },
      );
    });
  });

  describe('select() pipe mode', () => {
    it('always returns a valid option value on arbitrary input', async () => {
      const validValues = COLOR_OPTIONS.map((o) => o.value);
      await fc.assert(
        fc.asyncProperty(fc.string(), async (str) => {
          const ctx = createTestContext({ mode: 'pipe', io: { answers: [str] } });
          const result = await select({ title: 'test', options: COLOR_OPTIONS, ctx });
          expect(validValues).toContain(result);
        }),
        { numRuns: 200 },
      );
    });

    it('handles negative, float, and huge numbers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.integer().map(String),
            fc.float().map(String),
            fc.constant('-1'),
            fc.constant('999999'),
            fc.constant('0'),
            fc.constant('NaN'),
            fc.constant('Infinity'),
          ),
          async (str) => {
            const ctx = createTestContext({ mode: 'pipe', io: { answers: [str] } });
            const result = await select({ title: 'test', options: COLOR_OPTIONS, ctx });
            expect(COLOR_OPTIONS.map((o) => o.value)).toContain(result);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('multiselect() pipe mode', () => {
    it('always returns an array on arbitrary input', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (str) => {
          const ctx = createTestContext({ mode: 'pipe', io: { answers: [str] } });
          const result = await multiselect({ title: 'test', options: COLOR_OPTIONS, ctx });
          expect(Array.isArray(result)).toBe(true);
        }),
        { numRuns: 200 },
      );
    });

    it('handles malformed comma-separated lists', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant(',,1,,abc,2,'),
            fc.constant(','),
            fc.constant('1,2,3,4,5,6,7,8,9,10'),
            fc.array(fc.oneof(fc.integer().map(String), fc.string({ maxLength: 3 })), { maxLength: 10 })
              .map((parts) => parts.join(',')),
          ),
          async (str) => {
            const ctx = createTestContext({ mode: 'pipe', io: { answers: [str] } });
            const result = await multiselect({ title: 'test', options: COLOR_OPTIONS, ctx });
            expect(Array.isArray(result)).toBe(true);
            const validValues = COLOR_OPTIONS.map((o) => o.value);
            for (const v of result) {
              expect(validValues).toContain(v);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('rapid repeated calls', () => {
    it('50 sequential input() calls all resolve', async () => {
      const answers = Array.from({ length: 50 }, (_, i) => `answer-${i}`);
      const ctx = createTestContext({ mode: 'pipe', io: { answers } });
      const results: string[] = [];
      for (let i = 0; i < 50; i++) {
        results.push(await input({ title: `q${i}`, ctx }));
      }
      expect(results).toHaveLength(50);
      expect(results[0]).toBe('answer-0');
      expect(results[49]).toBe('answer-49');
    });
  });
});
