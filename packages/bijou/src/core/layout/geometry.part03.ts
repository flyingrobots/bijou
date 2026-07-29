import { type GridTrack } from './geometry.part01.js';

export function solveTracks(
  total: number,
  tracks: readonly GridTrack[],
  gap: number,
): number[] {
  const available = Math.max(0, total - gap * Math.max(0, tracks.length - 1));
  const sizes = new Array<number>(tracks.length).fill(0);

  let fixed = 0;
  let frTotal = 0;

  for (const [i, track] of tracks.entries()) {
    if (typeof track === 'number') {
      const size = Math.max(0, Math.floor(track));
      sizes[i] = size;
      fixed += size;
    } else {
      frTotal += parseFr(track);
    }
  }

  if (fixed > available) {
    let remainingBudget = available;
    for (let i = 0; i < tracks.length; i++) {
      if (typeof tracks[i] !== 'number') continue;
      const next = Math.min(sizes[i] ?? 0, remainingBudget);
      sizes[i] = next;
      remainingBudget -= next;
      if (remainingBudget <= 0) remainingBudget = 0;
    }
    return sizes.map((size) => Math.max(0, size));
  }

  const remaining = Math.max(0, available - fixed);
  if (frTotal > 0) {
    let assigned = 0;
    const fractionalShares: {
      readonly index: number;
      readonly remainder: number;
    }[] = [];
    for (const [i, track] of tracks.entries()) {
      if (typeof track === 'number') continue;
      const fr = parseFr(track);
      const rawShare = (remaining * fr) / frTotal;
      const size = Math.floor(rawShare);
      sizes[i] = size;
      assigned += size;
      fractionalShares.push({ index: i, remainder: rawShare - size });
    }
    let leftover = remaining - assigned;
    fractionalShares.sort(
      (left, right) =>
        right.remainder - left.remainder || left.index - right.index,
    );
    for (const { index } of fractionalShares) {
      if (leftover <= 0) break;
      sizes[index] = (sizes[index] ?? 0) + 1;
      leftover -= 1;
    }
  }

  return sizes.map((size) => Math.max(0, size));
}
export function parseFr(track: `${number}fr`): number {
  const raw = track.slice(0, -2);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`solveGridRects: invalid fr track "${track}"`);
  }
  return parsed;
}
export function trackStarts(sizes: readonly number[], gap: number): number[] {
  const starts: number[] = [];
  let cursor = 0;
  for (const [i, size] of sizes.entries()) {
    starts.push(cursor);
    cursor += size + (i < sizes.length - 1 ? gap : 0);
  }
  return starts;
}
export function sum(values: readonly number[]): number {
  let acc = 0;
  for (const value of values) acc += value;
  return acc;
}
export function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
