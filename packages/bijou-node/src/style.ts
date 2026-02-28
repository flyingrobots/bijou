import chalk, { Chalk, type ChalkInstance } from 'chalk';
import type { StylePort, TokenValue } from '@flyingrobots/bijou';

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
export function chalkStyle(noColor?: boolean): StylePort;
/**
 * Create a chalk-backed {@link StylePort} with detailed options.
 *
 * @param options - Configuration including `noColor` flag and explicit chalk `level`.
 * @returns A {@link StylePort} implemented via chalk.
 */
export function chalkStyle(options?: ChalkStyleOptions): StylePort;
// Implementation
export function chalkStyle(arg?: boolean | ChalkStyleOptions): StylePort {
  const opts = typeof arg === 'boolean' ? { noColor: arg } : (arg ?? {});
  const isNoColor = opts.noColor ?? false;
  const instance: ChalkInstance = opts.level !== undefined
    ? new Chalk({ level: opts.level })
    : chalk;

  /**
   * Chain text-decoration modifiers onto a chalk instance.
   *
   * Applies each modifier (`bold`, `dim`, `strikethrough`, `inverse`)
   * in order, returning the fully-decorated chalk instance.
   *
   * @param c - Base chalk instance (already color-configured).
   * @param modifiers - Optional array of modifier names from a {@link TokenValue}.
   * @returns The chalk instance with all modifiers applied.
   */
  function applyModifiers(c: ChalkInstance, modifiers?: TokenValue['modifiers']): ChalkInstance {
    if (modifiers === undefined) return c;
    let result = c;
    for (const mod of modifiers) {
      switch (mod) {
        case 'bold':          result = result.bold; break;
        case 'dim':           result = result.dim; break;
        case 'strikethrough': result = result.strikethrough; break;
        case 'inverse':       result = result.inverse; break;
        default: {
          const _exhaustive: never = mod;
          void _exhaustive;
        }
      }
    }
    return result;
  }

  return {
    /**
     * Apply a resolved design-token's hex color and modifiers to text.
     *
     * @param token - Resolved token value containing `hex` and optional `modifiers`.
     * @param text - Text to style.
     * @returns Styled text, or unmodified text when `noColor` is active.
     */
    styled(token: TokenValue, text: string): string {
      if (isNoColor) return text;
      const base: ChalkInstance = instance.hex(token.hex);
      return applyModifiers(base, token.modifiers)(text);
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
