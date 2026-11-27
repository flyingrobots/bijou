// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// Sine, cosine, log and x^1.5 from + - * / and sqrt alone. IEEE 754 rounds those exactly, so these give the same
// bits on every CPU, where V8's Math.sin, cos, log and pow may differ in the last bit between x64 and arm64. A demo
// whose recorded frames add up thousands of such results uses these to stay identical everywhere.

const TAU = 2 * Math.PI;
const HALF_PI = Math.PI / 2;
const LN2 = 0.6931471805599453;
const SQRT2 = 1.4142135623730951;

/** sin(x) by range reduction to [-pi/2, pi/2] and its Taylor series to x^17; error under 1e-12. */
export function detSin(x: number): number {
  let r = x - TAU * Math.round(x / TAU);
  if (r > HALF_PI) r = Math.PI - r;
  else if (r < -HALF_PI) r = -Math.PI - r;
  const r2 = r * r;
  let term = r;
  let sum = r;
  for (let n = 1; n <= 8; n += 1) {
    term *= -r2 / ((2 * n) * (2 * n + 1));
    sum += term;
  }
  return sum;
}

export const detCos = (x: number): number => detSin(x + HALF_PI);

/** The natural log of a positive x: x = m * 2^e with m near 1, then 2 atanh((m - 1) / (m + 1)) by its series. */
export function detLog(x: number): number {
  let m = x;
  let e = 0;
  while (m < 1) { m *= 2; e -= 1; }
  while (m >= 2) { m /= 2; e += 1; }
  if (m > SQRT2) { m /= 2; e += 1; }
  const s = (m - 1) / (m + 1);
  const s2 = s * s;
  let power = s;
  let sum = 0;
  for (let k = 1; k <= 23; k += 2) {
    sum += power / k;
    power *= s2;
  }
  return e * LN2 + 2 * sum;
}

export const detPow15 = (x: number): number => x * Math.sqrt(x);
