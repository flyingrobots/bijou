import type { Oklch, TokenValue } from '../../packages/bijou/src/index.js';
import { scaleOklch, type OklchScale } from '../../packages/bijou/src/core/viz/index.js';

/** A hero theme is a handful of OKLCH anchors; every colour on screen is derived from them. */
export interface HeroThemeSeed {
  readonly id: string;
  readonly label: string;
  readonly bg: Oklch;
  readonly panel: Oklch;
  readonly fg: Oklch;
  readonly muted: Oklch;
  readonly accent: Oklch;
  readonly accent2: Oklch;
  readonly rampLo: Oklch;
  readonly rampHi: Oklch;
}

export interface HeroPalette {
  readonly label: string;
  readonly bg: string;
  readonly panel: string;
  readonly fg: string;
  readonly muted: string;
  readonly accent: string;
  readonly accent2: string;
  /** Fresh perceptual ramp over a domain (heatmap and flamegraph mutate their scale's domain). */
  readonly rampScale: (domain: readonly [number, number]) => OklchScale;
  readonly rampHexes: readonly string[];
  readonly border: TokenValue;
  readonly accentToken: TokenValue;
  readonly accent2Token: TokenValue;
  readonly mutedToken: TokenValue;
  readonly panelToken: TokenValue;
}

export const HERO_THEMES: readonly HeroThemeSeed[] = [
  {
    id: 'dusk', label: 'Bijou Dusk',
    bg: { l: 0.16, c: 0.03, h: 285 }, panel: { l: 0.21, c: 0.04, h: 285 },
    fg: { l: 0.93, c: 0.02, h: 285 }, muted: { l: 0.62, c: 0.05, h: 285 },
    accent: { l: 0.74, c: 0.16, h: 330 }, accent2: { l: 0.80, c: 0.13, h: 210 },
    rampLo: { l: 0.45, c: 0.17, h: 290 }, rampHi: { l: 0.86, c: 0.16, h: 60 },
  },
  {
    id: 'aurora', label: 'Aurora',
    bg: { l: 0.15, c: 0.03, h: 220 }, panel: { l: 0.20, c: 0.04, h: 215 },
    fg: { l: 0.94, c: 0.02, h: 190 }, muted: { l: 0.63, c: 0.05, h: 200 },
    accent: { l: 0.82, c: 0.16, h: 160 }, accent2: { l: 0.76, c: 0.13, h: 250 },
    rampLo: { l: 0.42, c: 0.12, h: 260 }, rampHi: { l: 0.90, c: 0.17, h: 145 },
  },
  {
    id: 'ember', label: 'Ember',
    bg: { l: 0.16, c: 0.03, h: 40 }, panel: { l: 0.21, c: 0.04, h: 40 },
    fg: { l: 0.94, c: 0.03, h: 70 }, muted: { l: 0.64, c: 0.06, h: 55 },
    accent: { l: 0.76, c: 0.17, h: 45 }, accent2: { l: 0.86, c: 0.15, h: 95 },
    rampLo: { l: 0.40, c: 0.15, h: 20 }, rampHi: { l: 0.92, c: 0.16, h: 95 },
  },
];

const RAMP_STEPS = 16;

function hexOf(color: Oklch): string {
  return scaleOklch([0, 1], [color, color])(0).hex;
}

function lerpHue(a: number, b: number, t: number): number {
  const delta = ((b - a + 540) % 360) - 180;
  return (a + delta * t + 360) % 360;
}

/** Interpolate two OKLCH colours along the shortest hue arc. */
export function mixOklch(a: Oklch, b: Oklch, t: number): Oklch {
  return { l: a.l + (b.l - a.l) * t, c: a.c + (b.c - a.c) * t, h: lerpHue(a.h, b.h, t) };
}

/** Blend two theme seeds in OKLCH space, so a theme switch is a perceptual crossfade. */
export function mixSeeds(a: HeroThemeSeed, b: HeroThemeSeed, t: number): HeroThemeSeed {
  if (t <= 0) return a;
  if (t >= 1) return b;
  return {
    id: b.id, label: b.label,
    bg: mixOklch(a.bg, b.bg, t), panel: mixOklch(a.panel, b.panel, t),
    fg: mixOklch(a.fg, b.fg, t), muted: mixOklch(a.muted, b.muted, t),
    accent: mixOklch(a.accent, b.accent, t), accent2: mixOklch(a.accent2, b.accent2, t),
    rampLo: mixOklch(a.rampLo, b.rampLo, t), rampHi: mixOklch(a.rampHi, b.rampHi, t),
  };
}

export function compilePalette(seed: HeroThemeSeed): HeroPalette {
  const rampScale = (domain: readonly [number, number]): OklchScale => scaleOklch(domain, [seed.rampLo, seed.rampHi]);
  const ramp = rampScale([0, 1]);
  const panel = hexOf(seed.panel);
  const accent = hexOf(seed.accent);
  const accent2 = hexOf(seed.accent2);
  const muted = hexOf(seed.muted);
  return {
    label: seed.label,
    bg: hexOf(seed.bg), panel, fg: hexOf(seed.fg), muted, accent, accent2,
    rampScale,
    rampHexes: Array.from({ length: RAMP_STEPS }, (_, i) => ramp(i / (RAMP_STEPS - 1)).hex),
    border: { hex: muted, bg: panel },
    accentToken: { hex: accent, bg: panel, modifiers: ['bold'] },
    accent2Token: { hex: accent2, bg: panel },
    mutedToken: { hex: muted, bg: panel },
    panelToken: { hex: hexOf(seed.fg), bg: panel },
  };
}

export function sampleRamp(palette: HeroPalette, t: number): string {
  const ramp = palette.rampHexes;
  const index = Math.round(Math.max(0, Math.min(1, t)) * (ramp.length - 1));
  return ramp.at(index) ?? palette.fg;
}
