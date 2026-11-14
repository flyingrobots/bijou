import { interpolateHue, oklchToRgb, rgbToHex, type Oklch } from '../theme/color.js';
import { scaleLinear, type BandScale, type ContinuousScale, type OklchSample, type OklchScale } from './scales.js';

export function scaleLog(
  initialDomain: readonly [number, number] = [1, 10],
  initialRange: readonly [number, number] = [0, 1],
  base = 10,
): ContinuousScale {
  const safeBase = base > 0 && base !== 1 ? base : 10;
  const logB = (x: number): number => Math.log(Math.max(1e-12, x)) / Math.log(safeBase);
  const powB = (y: number): number => safeBase ** y;
  let d0 = Math.max(1e-12, Number.isFinite(initialDomain[0]) ? initialDomain[0] : 1);
  let d1 = Math.max(1e-12, Number.isFinite(initialDomain[1]) ? initialDomain[1] : 10);
  const inner = scaleLinear([logB(d0), logB(d1)], initialRange);
  function domain(): readonly [number, number];
  function domain(next: readonly [number, number]): ContinuousScale;
  function domain(next?: readonly [number, number]): readonly [number, number] | ContinuousScale {
    if (!next) return [d0, d1];
    d0 = Math.max(1e-12, Number.isFinite(next[0]) ? next[0] : 1);
    d1 = Math.max(1e-12, Number.isFinite(next[1]) ? next[1] : 10);
    inner.domain([logB(d0), logB(d1)]);
    return scale;
  }
  function range(): readonly [number, number];
  function range(next: readonly [number, number]): ContinuousScale;
  function range(next?: readonly [number, number]): readonly [number, number] | ContinuousScale {
    if (!next) return inner.range();
    inner.range(next);
    return scale;
  }
  function clamp(): boolean;
  function clamp(next: boolean): ContinuousScale;
  function clamp(next?: boolean): boolean | ContinuousScale {
    if (next === undefined) return inner.clamp();
    inner.clamp(next);
    return scale;
  }

  const scale: ContinuousScale = Object.assign(
    (value: number): number => inner(logB(Number.isFinite(value) && value > 0 ? value : d0)),
    {
      domain,
      range,
      clamp,
      nice(): ContinuousScale {
        const rev = d0 > d1;
        d0 = powB(rev ? Math.ceil(logB(d0)) : Math.floor(logB(d0)));
        d1 = powB(rev ? Math.floor(logB(d1)) : Math.ceil(logB(d1)));
        inner.domain([logB(d0), logB(d1)]);
        return scale;
      },
      ticks(count = 5): number[] {
        const p0 = Math.ceil(logB(Math.min(d0, d1)));
        const p1 = Math.floor(logB(Math.max(d0, d1)));
        const out: number[] = [];
        const stride = Math.max(1, Math.ceil((p1 - p0 + 1) / Math.max(1, count)));
        for (let p = p0; p <= p1; p += stride) out.push(Number(powB(p).toPrecision(12)));
        return out.length > 0 ? out : [d0, d1];
      },
      invert: (output: number): number => powB(inner.invert(output)),
      clone: (): ContinuousScale => scaleLog([d0, d1], inner.range(), safeBase).clamp(inner.clamp()),
    },
  );
  return scale;
}

export function scaleBand<T extends string = string>(
  initialDomain: readonly T[] = [],
  initialRange: readonly [number, number] = [0, 1],
  initialPadding = 0.1,
): BandScale<T> {
  let keys: readonly T[] = [...initialDomain];
  let [r0, r1] = initialRange;
  let pad = Math.max(0, Math.min(0.9, initialPadding));
  const computeStep = (): number => (keys.length === 0 ? 0 : Math.abs(r1 - r0) / Math.max(1, keys.length + pad));

  function domain(): readonly T[];
  function domain(next: readonly T[]): BandScale<T>;
  function domain(next?: readonly T[]): readonly T[] | BandScale<T> {
    if (!next) return keys;
    keys = [...next];
    return scale;
  }

  function range(): readonly [number, number];
  function range(next: readonly [number, number]): BandScale<T>;
  function range(next?: readonly [number, number]): readonly [number, number] | BandScale<T> {
    if (!next) return [r0, r1];
    [r0, r1] = next;
    return scale;
  }

  function padding(): number;
  function padding(next: number): BandScale<T>;
  function padding(next?: number): number | BandScale<T> {
    if (next === undefined) return pad;
    pad = Math.max(0, Math.min(0.9, next));
    return scale;
  }

  const scale: BandScale<T> = Object.assign(
    (key: string): number | undefined => {
      const idx = keys.findIndex((k) => k === key);
      if (idx < 0) return undefined;
      const step = computeStep();
      return Math.min(r0, r1) + step * (pad / 2) + idx * step;
    },
    { domain, range, padding, step: computeStep, bandwidth: (): number => computeStep() * (1 - pad) },
  );
  return scale;
}

export function scaleOklch(
  initialDomain: readonly [number, number] = [0, 1],
  initialStops: readonly [Oklch, Oklch] = [{ l: 0.62, c: 0.14, h: 250 }, { l: 0.78, c: 0.17, h: 35 }],
): OklchScale {
  let [d0, d1] = initialDomain;
  let stops: readonly [Oklch, Oklch] = initialStops;

  function domain(): readonly [number, number];
  function domain(next: readonly [number, number]): OklchScale;
  function domain(next?: readonly [number, number]): readonly [number, number] | OklchScale {
    if (!next) return [d0, d1];
    [d0, d1] = next;
    return scale;
  }

  function stopsFn(): readonly [Oklch, Oklch];
  function stopsFn(next: readonly [Oklch, Oklch]): OklchScale;
  function stopsFn(next?: readonly [Oklch, Oklch]): readonly [Oklch, Oklch] | OklchScale {
    if (!next) return stops;
    stops = next;
    return scale;
  }
  const scale: OklchScale = Object.assign(
    (value: number): OklchSample => {
      const span = d1 - d0;
      const rawT = span === 0 ? 0.5 : (value - d0) / span;
      const t = Math.max(0, Math.min(1, Number.isFinite(rawT) ? rawT : 0));
      const [a, b] = stops;
      const oklch: Oklch = { l: a.l + (b.l - a.l) * t, c: Math.max(0, a.c + (b.c - a.c) * t), h: interpolateHue(a.h, b.h, t) };
      const rgb = oklchToRgb(oklch);
      return { oklch, rgb, hex: rgbToHex(rgb) };
    },
    { domain, stops: stopsFn },
  );
  return scale;
}
