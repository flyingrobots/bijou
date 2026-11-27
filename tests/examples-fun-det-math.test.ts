import { describe, expect, it } from 'vitest';
import { detCos, detLog, detPow15, detSin } from '../examples/fun/demos/det-math.js';

const samples = Array.from({ length: 2001 }, (_, i) => -40 + i * 0.04);

describe('deterministic maths for the generative painting', () => {
  it('sin and cos agree with Math to 1e-10 across many turns', () => {
    for (const x of samples) {
      expect(Math.abs(detSin(x) - Math.sin(x))).toBeLessThan(1e-10);
      expect(Math.abs(detCos(x) - Math.cos(x))).toBeLessThan(1e-10);
    }
  });

  it('log agrees with Math on (0, 1], down to tiny values', () => {
    for (let k = 1; k <= 1000; k += 1) {
      const v = k / 1000;
      expect(Math.abs(detLog(v) - Math.log(v))).toBeLessThan(1e-12);
    }
    expect(Math.abs(detLog(2 ** -40) - Math.log(2 ** -40))).toBeLessThan(1e-10);
  });

  it('x to the 1.5 agrees with Math', () => {
    for (let x = 1; x <= 20; x += 1) expect(Math.abs(detPow15(x) - x ** 1.5) / x ** 1.5).toBeLessThan(1e-15);
  });
});
