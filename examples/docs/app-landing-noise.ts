/** Fixed-seed gradient noise: pure samples, without mutable permutation tables. */
function hash(x: number, y: number, z: number): number {
  let value = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647) ^ 0x4b1d2637;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return value ^ (value >>> 16);
}

function gradient(value: number, x: number, y: number, z: number): number {
  const h = value & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function fade(t: number): number { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

/** Smooth 3D Perlin noise; the third axis lets a field evolve rather than flicker. */
export function landingPerlinNoise(x: number, y: number, z: number): number {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const dx = x - ix, dy = y - iy, dz = z - iz;
  const u = fade(dx), v = fade(dy), w = fade(dz);
  const a = lerp(gradient(hash(ix, iy, iz), dx, dy, dz), gradient(hash(ix + 1, iy, iz), dx - 1, dy, dz), u);
  const b = lerp(gradient(hash(ix, iy + 1, iz), dx, dy - 1, dz), gradient(hash(ix + 1, iy + 1, iz), dx - 1, dy - 1, dz), u);
  const c = lerp(gradient(hash(ix, iy, iz + 1), dx, dy, dz - 1), gradient(hash(ix + 1, iy, iz + 1), dx - 1, dy, dz - 1), u);
  const d = lerp(gradient(hash(ix, iy + 1, iz + 1), dx, dy - 1, dz - 1), gradient(hash(ix + 1, iy + 1, iz + 1), dx - 1, dy - 1, dz - 1), u);
  return lerp(lerp(a, b, v), lerp(c, d, v), w);
}

/** Terminal cells are roughly twice as tall as wide; keep clouds physically round. */
export function landingNoiseDensity(x: number, y: number, timeMs: number): number {
  const time = (Number.isFinite(timeMs) ? timeMs : 0) * 0.00004;
  const u = x * 0.065 + 11.7 - time * 0.16;
  const v = y * 0.13 + 4.8 + time * 0.1;
  const z = time + 2.3;
  const value = landingPerlinNoise(u, v, z) * 0.65
    + landingPerlinNoise(u * 2 + 19.1, v * 2 - 7.3, z * 1.3) * 0.25
    + landingPerlinNoise(u * 4 - 5.7, v * 4 + 31.2, z * 1.7) * 0.1;
  return Math.max(0, Math.min(1, 0.5 + value * 1.6));
}
