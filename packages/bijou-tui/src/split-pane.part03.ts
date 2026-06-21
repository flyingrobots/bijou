import { graphemeClusterWidth, graphemeWidth, segmentGraphemes } from '@flyingrobots/bijou';
export function resolveDividerChar(dividerChar: string | undefined, fallback: string): string {
  if (dividerChar == null || dividerChar.length === 0) return fallback;
  const graphemes = segmentGraphemes(dividerChar);
  if (graphemes.length === 0) return fallback;
  const first = graphemes[0];
  if (first !== undefined && graphemes.length === 1 && graphemeClusterWidth(first) === 1) {
    return first;
  }
  for (const grapheme of graphemes) {
    if (graphemeClusterWidth(grapheme) === 1) return grapheme;
  }
  return fallback;
}
export function repeatToWidth(unit: string, targetWidth: number): string {
  const width = Math.max(0, targetWidth);
  if (width === 0) return '';

  const unitWidth = graphemeWidth(unit);
  if (unitWidth <= 0) return ' '.repeat(width);
  if (unitWidth === 1) return unit.repeat(width);

  let out = '';
  let remaining = width;
  while (remaining >= unitWidth) {
    out += unit;
    remaining -= unitWidth;
  }
  if (remaining > 0) out += ' '.repeat(remaining);
  return out;
}
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
