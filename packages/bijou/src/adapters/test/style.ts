import type { StylePort } from '../../ports/style.js';
import type { TokenValue } from '../../core/theme/tokens.js';

/**
 * Create a no-op {@link StylePort} that returns text unchanged.
 *
 * Use in tests where color output is irrelevant; all methods act as
 * identity functions so string equality assertions work without
 * stripping ANSI escape codes.
 *
 * @returns A {@link StylePort} whose methods pass text through unmodified.
 */
export function plainStyle(): StylePort {
  return {
    /**
     * Return text unchanged, ignoring the design token.
     * @param _token - Ignored design-token value.
     * @param text - The text to return.
     * @returns The original text.
     */
    styled(_token: TokenValue, text: string): string {
      return text;
    },

    /**
     * Return text unchanged, ignoring RGB color channels.
     * @param _r - Ignored red channel.
     * @param _g - Ignored green channel.
     * @param _b - Ignored blue channel.
     * @param text - The text to return.
     * @returns The original text.
     */
    rgb(_r: number, _g: number, _b: number, text: string): string {
      return text;
    },

    /**
     * Return text unchanged, ignoring the hex color.
     * @param _color - Ignored hex color string.
     * @param text - The text to return.
     * @returns The original text.
     */
    hex(_color: string, text: string): string {
      return text;
    },

    /**
     * Return text unchanged, ignoring bold decoration.
     * @param text - The text to return.
     * @returns The original text.
     */
    bold(text: string): string {
      return text;
    },
  };
}
