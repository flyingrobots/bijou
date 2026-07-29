const STOPS = [
  { pos: 0, r: 0x00, g: 0x00, b: 0x00 },
  { pos: 0.1, r: 0x30, g: 0x00, b: 0x30 },
  { pos: 0.25, r: 0x8b, g: 0x00, b: 0x00 },
  { pos: 0.4, r: 0xff, g: 0x00, b: 0x00 },
  { pos: 0.55, r: 0xff, g: 0x45, b: 0x00 },
  { pos: 0.7, r: 0xff, g: 0xd7, b: 0x00 },
  { pos: 0.85, r: 0xff, g: 0xfa, b: 0xcd },
  { pos: 1, r: 0xff, g: 0xff, b: 0xff },
] as const;
type PaletteStop = (typeof STOPS)[number];

export function sampleFlamePalette(value: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, value));
  let lower: PaletteStop = STOPS[0];
  let upper: PaletteStop = STOPS.at(-1) ?? lower;
  for (let index = 0; index < STOPS.length - 1; index++) {
    const current = STOPS[index] ?? lower;
    const next = STOPS[index + 1] ?? upper;
    if (clamped >= current.pos && clamped <= next.pos) {
      lower = current;
      upper = next;
      break;
    }
  }
  const range = upper.pos - lower.pos;
  const factor = range === 0 ? 0 : (clamped - lower.pos) / range;
  return [
    Math.round(lower.r + factor * (upper.r - lower.r)),
    Math.round(lower.g + factor * (upper.g - lower.g)),
    Math.round(lower.b + factor * (upper.b - lower.b)),
  ];
}

export function createFlameNoise(): (x: number, y: number) => number {
  const tableSize = 256;
  const values = new Float64Array(tableSize);
  const permutation = new Uint16Array(tableSize * 2);
  let seed = 42;
  const random = (): number => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0x100000000;
  };

  for (let index = 0; index < tableSize; index++) {
    values[index] = random();
    permutation[index] = index;
  }
  for (let index = tableSize - 1; index > 0; index--) {
    const target = (random() * (index + 1)) | 0;
    const temporary = permutation[index] ?? 0;
    permutation[index] = permutation[target] ?? 0;
    permutation[target] = temporary;
    permutation[index + tableSize] = permutation[index] ?? 0;
  }
  permutation[tableSize] = permutation[0] ?? 0;

  return (x: number, y: number): number => {
    const xInteger = Math.floor(x);
    const yInteger = Math.floor(y);
    const xOffset = x - xInteger;
    const yOffset = y - yInteger;
    const x0 = ((xInteger % tableSize) + tableSize) % tableSize;
    const x1 = (x0 + 1) % tableSize;
    const y0 = ((yInteger % tableSize) + tableSize) % tableSize;
    const y1 = (y0 + 1) % tableSize;
    const c00 = values[permutation[(permutation[x0] ?? 0) + y0] ?? 0] ?? 0;
    const c10 = values[permutation[(permutation[x1] ?? 0) + y0] ?? 0] ?? 0;
    const c01 = values[permutation[(permutation[x0] ?? 0) + y1] ?? 0] ?? 0;
    const c11 = values[permutation[(permutation[x1] ?? 0) + y1] ?? 0] ?? 0;
    const smoothX = xOffset * xOffset * (3 - 2 * xOffset);
    const smoothY = yOffset * yOffset * (3 - 2 * yOffset);
    const lower = c00 + smoothX * (c10 - c00);
    const upper = c01 + smoothX * (c11 - c01);
    return lower + smoothY * (upper - lower);
  };
}
