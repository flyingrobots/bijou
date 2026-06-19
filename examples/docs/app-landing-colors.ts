import { lerp3 } from '../../packages/bijou/src/index.js';
import type { Rgb } from './app-landing-types.js';

const LANDING_COLOR_RAMP_SIZE = 256;

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

export function createGradientStops(gradient: readonly [string, string, string]): { pos: number; color: Rgb }[] {
  return [
    { pos: 0, color: hexToRgb(gradient[0]) },
    { pos: 0.5, color: hexToRgb(gradient[1]) },
    { pos: 1, color: hexToRgb(gradient[2]) },
  ];
}

export function gradientStopsFromHexes(colors: readonly string[]): { pos: number; color: Rgb }[] {
  if (colors.length === 0) return [];
  if (colors.length === 1) {
    const onlyColor = colors[0];
    return onlyColor === undefined ? [] : [{ pos: 0, color: hexToRgb(onlyColor) }];
  }
  return colors.map((hex, index) => ({
    pos: index / (colors.length - 1),
    color: hexToRgb(hex),
  }));
}

export function buildColorRamp(stops: { pos: number; color: Rgb }[]): readonly string[] {
  const ramp = new Array<string>(LANDING_COLOR_RAMP_SIZE);
  for (let index = 0; index < LANDING_COLOR_RAMP_SIZE; index++) {
    const t = index / (LANDING_COLOR_RAMP_SIZE - 1 || 1);
    ramp[index] = rgbHex(...lerp3(stops, t));
  }
  return ramp;
}

export function sampleColorRamp(ramp: readonly string[], t: number): string {
  const index = Math.max(0, Math.min(ramp.length - 1, Math.round(clamp01(t) * (ramp.length - 1))));
  return ramp[index] ?? '#000000';
}

function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace(/^#/, '');
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

export function rgbHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function mixHexColor(from: string, to: string, t: number): string {
  const [fromR, fromG, fromB] = hexToRgb(from);
  const [toR, toG, toB] = hexToRgb(to);
  const mixT = clamp01(t);
  return rgbHex(
    Math.round(fromR + ((toR - fromR) * mixT)),
    Math.round(fromG + ((toG - fromG) * mixT)),
    Math.round(fromB + ((toB - fromB) * mixT)),
  );
}

export function oppositeHexColor(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbHex(255 - r, 255 - g, 255 - b);
}

function srgbChannelToLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * srgbChannelToLinear(r))
    + (0.7152 * srgbChannelToLinear(g))
    + (0.0722 * srgbChannelToLinear(b));
}

function contrastRatio(a: string, b: string): number {
  const lighter = Math.max(relativeLuminance(a), relativeLuminance(b));
  const darker = Math.min(relativeLuminance(a), relativeLuminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

function colorDistance(a: string, b: string): number {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return Math.sqrt((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2);
}

export function pickStandoutColor(background: string, base: string, candidates: readonly string[]): string {
  let best = candidates[0] ?? base;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const candidate of candidates) {
    const contrast = contrastRatio(candidate, background);
    const distance = colorDistance(candidate, base) / Math.sqrt(3 * 255 * 255);
    const score = contrast * 3 + distance;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}
