import chalk, { Chalk, type ChalkInstance } from 'chalk';
import type { StylePort, TokenValue } from '@flyingrobots/bijou';
import { createChalkTokenStyler } from './chalk-token-styler.js';

/**
 * Configuration options for {@link chalkStyle}.
 */
export interface ChalkStyleOptions {
  /** Disable all color output, returning unstyled text. */
  noColor?: boolean;
  /** Explicit chalk color level override: 0=none, 1=ansi16, 2=ansi256, 3=truecolor. */
  level?: 0 | 1 | 2 | 3;
}

/**
 * Create a chalk-backed {@link StylePort} with optional color suppression.
 *
 * @param noColor - Pass `true` to suppress all ANSI styling.
 * @returns A {@link StylePort} implemented via chalk.
 */
export function chalkStyle(arg?: boolean | ChalkStyleOptions): StylePort {
  const opts = typeof arg === 'boolean' ? { noColor: arg } : (arg ?? {});
  const isNoColor = opts.noColor ?? false;
  const instance: ChalkInstance =
    opts.level !== undefined ? new Chalk({ level: opts.level }) : chalk;
  /** Whether ANSI styling is active (respects both noColor flag and chalk level). */
  const ansiEnabled = !isNoColor && instance.level > 0;
  const styleToken = createChalkTokenStyler(instance, ansiEnabled);

  return {
    /**
     * Apply a resolved design-token's hex color and modifiers to text.
     *
     * @param token - Resolved token value containing `hex` and optional `modifiers`.
     * @param text - Text to style.
     * @returns Styled text, or unmodified text when ANSI output is disabled via `noColor` or `level: 0`.
     */
    styled(token: TokenValue, text: string): string {
      return styleToken(token, text);
    },
    /**
     * Apply a 24-bit RGB foreground color to text.
     *
     * @param r - Red channel (0-255).
     * @param g - Green channel (0-255).
     * @param b - Blue channel (0-255).
     * @param text - Text to style.
     * @returns Styled text, or unmodified text when `noColor` is active.
     */
    rgb(r: number, g: number, b: number, text: string): string {
      if (isNoColor) return text;
      return instance.rgb(r, g, b)(text);
    },

    /**
     * Apply a hex foreground color to text.
     *
     * @param color - CSS-style hex color (e.g. `"#ff00aa"`).
     * @param text - Text to style.
     * @returns Styled text, or unmodified text when `noColor` is active.
     */
    hex(color: string, text: string): string {
      if (isNoColor) return text;
      return instance.hex(color)(text);
    },

    /**
     * Apply a 24-bit RGB background color to text.
     *
     * @param r - Red channel (0-255).
     * @param g - Green channel (0-255).
     * @param b - Blue channel (0-255).
     * @param text - Text to style.
     * @returns Styled text, or unmodified text when `noColor` is active.
     */
    bgRgb(r: number, g: number, b: number, text: string): string {
      if (isNoColor) return text;
      return instance.bgRgb(r, g, b)(text);
    },

    /**
     * Apply a hex background color to text.
     *
     * @param color - CSS-style hex color (e.g. `"#ff00aa"`).
     * @param text - Text to style.
     * @returns Styled text, or unmodified text when `noColor` is active.
     */
    bgHex(color: string, text: string): string {
      if (isNoColor) return text;
      return instance.bgHex(color)(text);
    },

    /**
     * Apply bold weight to text.
     *
     * @param text - Text to style.
     * @returns Bold text, or unmodified text when `noColor` is active.
     */
    bold(text: string): string {
      if (isNoColor) return text;
      return instance.bold(text);
    },
  };
}
