import { hexToRgb } from './color.js';
import type { ThemeColorRuleDefinition } from './graph-types.js';

export function scoreThemeRuleCandidate(
  rule: ThemeColorRuleDefinition,
  hex: string | undefined,
  target: string | undefined,
  ratio: number | undefined,
): number {
  if (hex === undefined) return Number.NEGATIVE_INFINITY;
  if (rule.rule === 'best-contrast-with' || rule.rule === 'min-contrast-with') return ratio ?? 0;
  if (rule.rule === 'closest-color') {
    return target === undefined ? Number.NEGATIVE_INFINITY : -rgbDistance(hex, target);
  }
  if (rule.rule === 'least-vivid') return -chroma(hex);
  if (rule.rule === 'nth-color') return 0;
  return chroma(hex);
}

export function nthThemeRuleIndex(length: number, index: number): number {
  if (length === 0) return -1;
  if (Number.isInteger(index)) {
    return index < 0 ? Math.max(0, length + index) : Math.min(length - 1, index);
  }

  const clamped = Math.max(0, Math.min(1, index));
  return Math.round((length - 1) * clamped);
}

function chroma(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return Math.max(r, g, b) - Math.min(r, g, b);
}

function rgbDistance(a: string, b: string): number {
  const ar = hexToRgb(a);
  const br = hexToRgb(b);
  return (ar[0] - br[0]) ** 2 + (ar[1] - br[1]) ** 2 + (ar[2] - br[2]) ** 2;
}
