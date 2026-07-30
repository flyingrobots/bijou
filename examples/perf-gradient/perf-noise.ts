/** Create the deterministic OpenSimplex-style noise function used by the demo. */
export function createNoise2D(seed: number): (x: number, y: number) => number {
  const stretch = (1 / Math.sqrt(3) - 1) / 2;
  const squish = (Math.sqrt(3) - 1) / 2;
  const norm = 1 / 47;
  const gradients = [
    5, 2, 2, 5, -5, 2, -2, 5,
    5, -2, 2, -5, -5, -2, -2, -5,
  ];
  const permutation = new Uint8Array(256);
  const source = new Uint8Array(256);
  const gradient = (index: number): number => gradients[index] ?? 0;
  const permuted = (index: number): number =>
    permutation[index & 0xff] ?? 0;
  const contribution = (
    xsb: number,
    ysb: number,
    dx: number,
    dy: number,
    offsetX: number,
    offsetY: number,
  ): number => {
    let attenuation = 2 - dx * dx - dy * dy;
    if (attenuation <= 0) return 0;
    const index =
      permuted(permuted(xsb + offsetX) + ysb + offsetY) & 0x0e;
    attenuation *= attenuation;
    return attenuation * attenuation
      * (gradient(index) * dx + gradient(index + 1) * dy);
  };
  for (let index = 0; index < 256; index++) source[index] = index;
  let state = (seed * 1664525 + 1013904223) | 0;
  for (let index = 0; index < 2; index++) {
    state = (state * 1664525 + 1013904223) | 0;
  }
  for (let index = 255; index >= 0; index--) {
    state = (state * 1664525 + 1013904223) | 0;
    let target = (state + 31) % (index + 1);
    if (target < 0) target += index + 1;
    permutation[index] = source[target] ?? 0;
    source[target] = source[index] ?? 0;
  }
  return (x, y) => {
    const stretched = (x + y) * stretch;
    const xs = x + stretched;
    const ys = y + stretched;
    const xsb = Math.floor(xs);
    const ysb = Math.floor(ys);
    const squished = (xsb + ysb) * squish;
    const dx0 = x - (xsb + squished);
    const dy0 = y - (ysb + squished);
    const xins = xs - xsb;
    const yins = ys - ysb;
    let value = 0;
    value += contribution(xsb, ysb, dx0, dy0, 0, 0);
    value += contribution(
      xsb,
      ysb,
      dx0 - 1 - squish,
      dy0 - squish,
      1,
      0,
    );
    value += contribution(
      xsb,
      ysb,
      dx0 - squish,
      dy0 - 1 - squish,
      0,
      1,
    );
    if (xins + yins > 1) {
      value += contribution(
        xsb,
        ysb,
        dx0 - 1 - 2 * squish,
        dy0 - 1 - 2 * squish,
        1,
        1,
      );
    }
    return value * norm;
  };
}

export const PERF_NOISE = createNoise2D(42);
export const PERF_DENSITY = 'Ñ@#W$9876543210?!abcxyz;:+=-,._ ';
