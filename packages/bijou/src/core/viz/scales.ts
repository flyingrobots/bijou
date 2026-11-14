import type { Oklch } from '../theme/color.js';
import type { RGB } from '../theme/tokens.js';

export interface ContinuousScale {
  (value: number): number;
  domain(): readonly [number, number];
  domain(d: readonly [number, number]): ContinuousScale;
  range(): readonly [number, number];
  range(r: readonly [number, number]): ContinuousScale;
  clamp(): boolean;
  clamp(c: boolean): ContinuousScale;
  nice(count?: number): ContinuousScale;
  ticks(count?: number): number[];
  invert(output: number): number;
  clone(): ContinuousScale;
}

export interface BandScale<T extends string = string> {
  (key: string): number | undefined;
  domain(): readonly T[];
  domain(keys: readonly T[]): BandScale<T>;
  range(): readonly [number, number];
  range(r: readonly [number, number]): BandScale<T>;
  padding(): number;
  padding(p: number): BandScale<T>;
  bandwidth(): number;
  step(): number;
}

export interface OklchSample {
  readonly oklch: Oklch;
  readonly rgb: RGB;
  readonly hex: string;
}

export interface OklchScale {
  (value: number): OklchSample;
  domain(): readonly [number, number];
  domain(d: readonly [number, number]): OklchScale;
  stops(): readonly [Oklch, Oklch];
  stops(s: readonly [Oklch, Oklch]): OklchScale;
}

function niceStep(span: number, count: number): number {
  const raw = span / Math.max(1, count);
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const power = Math.floor(Math.log10(raw));
  const unit = 10 ** power;
  const err = raw / unit;
  if (err >= 7.5) return 10 * unit;
  if (err >= 3.5) return 5 * unit;
  if (err >= 1.5) return 2 * unit;
  return unit;
}

export function scaleLinear(
  initialDomain: readonly [number, number] = [0, 1],
  initialRange: readonly [number, number] = [0, 1],
  initialClamp = false,
): ContinuousScale {
  let d0 = Number.isFinite(initialDomain[0]) ? initialDomain[0] : 0;
  let d1 = Number.isFinite(initialDomain[1]) ? initialDomain[1] : 1;
  let r0 = Number.isFinite(initialRange[0]) ? initialRange[0] : 0;
  let r1 = Number.isFinite(initialRange[1]) ? initialRange[1] : 1;
  let clamped = initialClamp;

  function domain(): readonly [number, number];
  function domain(next: readonly [number, number]): ContinuousScale;
  function domain(next?: readonly [number, number]): readonly [number, number] | ContinuousScale {
    if (!next) return [d0, d1];
    d0 = Number.isFinite(next[0]) ? next[0] : 0;
    d1 = Number.isFinite(next[1]) ? next[1] : 1;
    return scale;
  }

  function range(): readonly [number, number];
  function range(next: readonly [number, number]): ContinuousScale;
  function range(next?: readonly [number, number]): readonly [number, number] | ContinuousScale {
    if (!next) return [r0, r1];
    r0 = Number.isFinite(next[0]) ? next[0] : 0;
    r1 = Number.isFinite(next[1]) ? next[1] : 1;
    return scale;
  }

  function clamp(): boolean;
  function clamp(next: boolean): ContinuousScale;
  function clamp(next?: boolean): boolean | ContinuousScale {
    if (next === undefined) return clamped;
    clamped = next;
    return scale;
  }

  const scale: ContinuousScale = Object.assign(
    (value: number): number => {
      const safe = Number.isFinite(value) ? value : d0;
      const span = d1 - d0;
      if (span === 0) return (r0 + r1) / 2;
      let t = (safe - d0) / span;
      if (clamped) t = Math.max(0, Math.min(1, t));
      return r0 + t * (r1 - r0);
    },
    {
      domain,
      range,
      clamp,
      nice(count = 5): ContinuousScale {
        if (d0 === d1) {
          d0 -= 1;
          d1 += 1;
          return scale;
        }
        const reverse = d1 < d0;
        const lo = reverse ? d1 : d0;
        const hi = reverse ? d0 : d1;
        const step = niceStep(hi - lo, count);
        const nLo = Math.floor(lo / step) * step;
        const nHi = Math.ceil(hi / step) * step;
        d0 = reverse ? nHi : nLo;
        d1 = reverse ? nLo : nHi;
        return scale;
      },
      ticks(count = 5): number[] {
        if (count <= 0) return [];
        if (d0 === d1) return [d0];
        const lo = Math.min(d0, d1);
        const hi = Math.max(d0, d1);
        const step = niceStep(hi - lo, count);
        const start = Math.ceil(lo / step);
        const end = Math.floor(hi / step);
        const result: number[] = [];
        for (let i = start; i <= end; i++) {
          const val = Number((i * step).toPrecision(12));
          result.push(Object.is(val, -0) ? 0 : val);
        }
        return result.length > 0 ? result : [lo, hi];
      },
      invert(output: number): number {
        const rSpan = r1 - r0;
        if (rSpan === 0) return d0;
        let t = (output - r0) / rSpan;
        if (clamped) t = Math.max(0, Math.min(1, t));
        return d0 + t * (d1 - d0);
      },
      clone: (): ContinuousScale => scaleLinear([d0, d1], [r0, r1], clamped),
    },
  );
  return scale;
}
