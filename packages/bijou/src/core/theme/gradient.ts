import type { RGB, GradientStop } from './tokens.js';
import type { StylePort } from '../../ports/style.js';

/**
 * Linearly interpolate an RGB color from a sorted array of gradient stops.
 * @param stops - Gradient stops sorted by ascending position.
 * @param t - Normalized position (0-1) to sample.
 * @returns Interpolated RGB color at position `t`.
 */
export function lerp3(stops: GradientStop[], t: number): RGB {
  if (stops.length === 0) return [0, 0, 0];
  if (stops.length === 1 || t <= stops[0]!.pos) return stops[0]!.color;
  if (t >= stops[stops.length - 1]!.pos) return stops[stops.length - 1]!.color;

  for (let s = 0; s < stops.length - 1; s++) {
    const a = stops[s]!;
    const b = stops[s + 1]!;
    if (t >= a.pos && t <= b.pos) {
      if (a.pos === b.pos) return a.color;
      const local = (t - a.pos) / (b.pos - a.pos);
      return [
        Math.round(a.color[0] + (b.color[0] - a.color[0]) * local),
        Math.round(a.color[1] + (b.color[1] - a.color[1]) * local),
        Math.round(a.color[2] + (b.color[2] - a.color[2]) * local),
      ];
    }
  }

  return stops[stops.length - 1]!.color;
}

/** Options for rendering gradient-colored text. */
export interface GradientTextOptions {
  /** Style port used to apply RGB colors to individual characters. */
  style: StylePort;
  /** When true, return plain text without any color escapes. */
  noColor?: boolean;
}

/**
 * Apply a gradient color to each character of a string.
 * @param text - Text to colorize.
 * @param stops - Gradient color stops.
 * @param options - Style port and noColor flag.
 * @returns The text with per-character RGB coloring applied (or plain text if noColor).
 */
export function gradientText(text: string, stops: GradientStop[], options: GradientTextOptions): string {
  if (options.noColor || text.length === 0 || stops.length === 0) return text;

  let result = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (ch === ' ' || ch === '\n') {
      result += ch;
      continue;
    }
    const t = text.length === 1 ? 0 : i / (text.length - 1);
    const [r, g, b] = lerp3(stops, t);
    result += options.style.rgb(r, g, b, ch);
  }
  return result;
}
