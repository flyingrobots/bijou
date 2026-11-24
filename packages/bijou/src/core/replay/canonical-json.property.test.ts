import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { canonicalJson, compareCodePoints } from './canonical-json.js';

const SEED = 600;

describe('canonicalJson() properties (seeded)', () => {
  it('is a fixed point after a JSON round trip', () => {
    fc.assert(
      fc.property(fc.jsonValue(), (value) => {
        const text = canonicalJson(value);
        const parsed: unknown = JSON.parse(text);
        expect(canonicalJson(parsed)).toBe(text);
      }),
      { seed: SEED, numRuns: 300 },
    );
  });

  it('does not depend on key insertion order', () => {
    fc.assert(
      fc.property(fc.dictionary(fc.string({ unit: 'binary' }), fc.integer()), (record) => {
        const reversed = Object.fromEntries(Object.entries(record).reverse());
        expect(canonicalJson(reversed)).toBe(canonicalJson(record));
      }),
      { seed: SEED, numRuns: 300 },
    );
  });

  it('orders keys as a code-point sort of the strings does', () => {
    fc.assert(
      fc.property(fc.uniqueArray(fc.string({ unit: 'binary' }), { maxLength: 8 }), (keys) => {
        const record = Object.fromEntries(keys.map((key, index) => [key, index]));
        // Built by hand: Object.keys() would put integer-like keys first.
        const expected = [...keys]
          .sort((left, right) => compareCodePoints(left, right))
          .map((key) => `${JSON.stringify(key)}:${String(keys.indexOf(key))}`);
        expect(canonicalJson(record)).toBe(`{${expected.join(',')}}`);
      }),
      { seed: SEED, numRuns: 300 },
    );
  });

  it('matches code-point order from Array.from on every string pair', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'binary' }), fc.string({ unit: 'binary' }), (left, right) => {
        const a = Array.from(left, (char) => char.codePointAt(0) ?? 0);
        const b = Array.from(right, (char) => char.codePointAt(0) ?? 0);
        let expected = 0;
        for (let index = 0; index < Math.min(a.length, b.length) && expected === 0; index++) {
          expected = Math.sign((a[index] ?? 0) - (b[index] ?? 0));
        }
        if (expected === 0) expected = Math.sign(a.length - b.length);
        expect(Math.sign(compareCodePoints(left, right))).toBe(expected);
      }),
      { seed: SEED, numRuns: 500 },
    );
  });
});
