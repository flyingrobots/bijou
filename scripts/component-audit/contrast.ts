/** WCAG 2 contrast for the component audit: sRGB hex colours, relative luminance, and the drawn colour of dim text. */

export type Rgb = readonly [number, number, number];

/** Parse `#rgb` or `#rrggbb`; undefined for anything else. */
export function parseHex(hex: string): Rgb | undefined {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  const digits = match?.[1];
  if (digits === undefined) return undefined;
  const full = digits.length === 3 ? digits.replace(/./g, '$&$&') : digits;
  const channel = (i: number): number => parseInt(full.slice(i, i + 2), 16);
  return [channel(0), channel(2), channel(4)];
}

export function toHex(rgb: Rgb): string {
  return `#${rgb.map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('')}`;
}

/** WCAG 2 relative luminance of an sRGB colour. */
export function luminance(rgb: Rgb): number {
  const linear = (c: number): number => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2]);
}

/** WCAG 2 contrast ratio, from 1 (none) to 21 (black on white). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * The colour a terminal draws for dim text: most terminals halve the foreground's intensity toward the
 * background. The audit measures dim text as drawn, not as authored.
 */
export function dimmed(fg: Rgb, bg: Rgb): Rgb {
  return [(fg[0] + bg[0]) / 2, (fg[1] + bg[1]) / 2, (fg[2] + bg[2]) / 2];
}

/** WCAG thresholds the audit applies to text: below 3:1 is an error, below 4.5:1 a warning. */
export const CONTRAST_ERROR = 3;
export const CONTRAST_WARNING = 4.5;

/** Every `#hex` colour value anywhere in a theme object: the palette a component may draw with. */
export function themePalette(theme: unknown): Set<string> {
  const found = new Set<string>();
  const walk = (value: unknown, depth: number): void => {
    if (depth > 8 || value === null) return;
    if (typeof value === 'string') {
      const rgb = parseHex(value);
      if (rgb !== undefined) found.add(toHex(rgb));
    } else if (typeof value === 'object') {
      for (const child of Object.values(value)) walk(child, depth + 1);
    }
  };
  walk(theme, 0);
  return found;
}
