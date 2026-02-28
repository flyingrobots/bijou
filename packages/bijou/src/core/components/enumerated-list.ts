import type { BijouContext } from '../../ports/context.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';

/**
 * Enumeration style for list item prefixes.
 *
 * - `'arabic'` - Decimal numbering (1., 2., 3.)
 * - `'alpha'` - Lowercase alphabetic (a., b., c.)
 * - `'roman'` - Lowercase Roman numerals (i., ii., iii.)
 * - `'bullet'` - Unicode bullet character
 * - `'dash'` - En-dash character
 * - `'none'` - No prefix
 */
export type BulletStyle = 'arabic' | 'alpha' | 'roman' | 'bullet' | 'dash' | 'none';

/** Configuration options for the {@link enumeratedList} component. */
export interface EnumeratedListOptions {
  /** Bullet/numbering style. Defaults to `'arabic'`. */
  readonly style?: BulletStyle;
  /** Number of leading spaces for indentation. Defaults to `2`. */
  readonly indent?: number;
  /** Starting number for ordered styles. Defaults to `1`. */
  readonly start?: number;
  /** Bijou context for rendering mode and theme resolution. */
  readonly ctx?: BijouContext;
}

/**
 * Convert a positive integer to a lowercase Roman numeral string.
 *
 * @param n - The integer to convert.
 * @returns The Roman numeral representation.
 */
function toRoman(n: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['m', 'cm', 'd', 'cd', 'c', 'xc', 'l', 'xl', 'x', 'ix', 'v', 'iv', 'i'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]!) {
      result += syms[i]!;
      n -= vals[i]!;
    }
  }
  return result;
}

/**
 * Convert a positive integer to a lowercase alphabetic label (a, b, ..., z, aa, ab, ...).
 *
 * @param n - The 1-based integer to convert.
 * @returns The alphabetic label string.
 */
function toAlpha(n: number): string {
  let result = '';
  while (n > 0) {
    n--;
    result = String.fromCharCode(97 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

/**
 * Generate a Unicode list-item prefix for rich/interactive rendering.
 *
 * @param style - The bullet style to use.
 * @param index - The 1-based item index (used for ordered styles).
 * @returns The prefix string (e.g. `"3."`, `"b."`, `"•"`).
 */
function generatePrefix(style: BulletStyle, index: number): string {
  switch (style) {
    case 'arabic':
      return `${index}.`;
    case 'alpha':
      return `${toAlpha(index)}.`;
    case 'roman':
      return `${toRoman(index)}.`;
    case 'bullet':
      return '\u2022';
    case 'dash':
      return '\u2013';
    case 'none':
      return '';
  }
}

/**
 * Generate an ASCII list-item prefix for pipe-mode rendering.
 *
 * Falls back to `*` for bullets and `-` for dashes instead of Unicode characters.
 *
 * @param style - The bullet style to use.
 * @param index - The 1-based item index (used for ordered styles).
 * @returns The ASCII prefix string.
 */
function generatePipePrefix(style: BulletStyle, index: number): string {
  switch (style) {
    case 'arabic':
      return `${index}.`;
    case 'alpha':
      return `${toAlpha(index)}.`;
    case 'roman':
      return `${toRoman(index)}.`;
    case 'bullet':
      return '*';
    case 'dash':
      return '-';
    case 'none':
      return '';
  }
}

/**
 * Check whether a bullet style produces sequentially numbered prefixes.
 *
 * @param style - The bullet style to test.
 * @returns `true` if the style is `'arabic'`, `'alpha'`, or `'roman'`.
 */
function isOrderedStyle(style: BulletStyle): boolean {
  return style === 'arabic' || style === 'alpha' || style === 'roman';
}

/**
 * Render a formatted list with configurable numbering or bullet styles.
 *
 * Supports multi-line items with continuation-line indentation aligned to the
 * first content character. Ordered styles right-align prefixes for visual consistency.
 *
 * Adapts output by mode:
 * - `accessible`: simple decimal numbering regardless of style.
 * - `pipe`: ASCII-safe prefixes (`*`, `-`).
 * - `interactive`/`static`/no context: Unicode prefixes (`\u2022`, `\u2013`).
 *
 * @param items - List item strings to render (may contain newlines).
 * @param options - Rendering options including style, indent, start, and context.
 * @returns The formatted list string, or an empty string if `items` is empty.
 */
export function enumeratedList(items: readonly string[], options?: EnumeratedListOptions): string {
  if (items.length === 0) return '';

  const style = options?.style ?? 'arabic';
  const indent = options?.indent ?? 2;
  const start = options?.start ?? 1;
  const ctx = resolveCtx(options?.ctx);
  const mode = ctx?.mode;

  const indentStr = ' '.repeat(indent);

  // Accessible mode: simple numbering regardless of style
  if (mode === 'accessible') {
    return items
      .map((item, i) => {
        const num = start + i;
        const prefix = `${num}.`;
        const lines = item.split('\n');
        const firstLine = `${indentStr}${prefix} ${lines[0]}`;
        if (lines.length === 1) return firstLine;
        const contIndent = ' '.repeat(indent + prefix.length + 1);
        return [firstLine, ...lines.slice(1).map(l => `${contIndent}${l}`)].join('\n');
      })
      .join('\n');
  }

  // Pipe mode: ASCII fallbacks
  if (mode === 'pipe') {
    const prefixes = items.map((_, i) => generatePipePrefix(style, start + i));
    const maxPrefixLen = isOrderedStyle(style)
      ? Math.max(...prefixes.map(p => p.length))
      : 0;

    return items
      .map((item, i) => {
        const prefix = prefixes[i]!;
        const lines = item.split('\n');

        if (style === 'none') {
          const firstLine = `${indentStr}${lines[0]}`;
          if (lines.length === 1) return firstLine;
          const contIndent = indentStr;
          return [firstLine, ...lines.slice(1).map(l => `${contIndent}${l}`)].join('\n');
        }

        const paddedPrefix = isOrderedStyle(style)
          ? prefix.padStart(maxPrefixLen)
          : prefix;
        const firstLine = `${indentStr}${paddedPrefix} ${lines[0]}`;
        if (lines.length === 1) return firstLine;
        const contIndent = ' '.repeat(indent + paddedPrefix.length + 1);
        return [firstLine, ...lines.slice(1).map(l => `${contIndent}${l}`)].join('\n');
      })
      .join('\n');
  }

  // Interactive / static mode (or no context): full rendering
  const prefixes = items.map((_, i) => generatePrefix(style, start + i));
  const maxPrefixLen = isOrderedStyle(style)
    ? Math.max(...prefixes.map(p => p.length))
    : 0;

  return items
    .map((item, i) => {
      const prefix = prefixes[i]!;
      const lines = item.split('\n');

      if (style === 'none') {
        const firstLine = `${indentStr}${lines[0]}`;
        if (lines.length === 1) return firstLine;
        const contIndent = indentStr;
        return [firstLine, ...lines.slice(1).map(l => `${contIndent}${l}`)].join('\n');
      }

      const paddedPrefix = isOrderedStyle(style)
        ? prefix.padStart(maxPrefixLen)
        : prefix;
      const firstLine = `${indentStr}${paddedPrefix} ${lines[0]}`;
      if (lines.length === 1) return firstLine;
      const contIndent = ' '.repeat(indent + paddedPrefix.length + 1);
      return [firstLine, ...lines.slice(1).map(l => `${contIndent}${l}`)].join('\n');
    })
    .join('\n');
}
