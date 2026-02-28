import type { StylePort } from '../../ports/style.js';
import type { TokenValue, RGB } from '../../core/theme/tokens.js';

/**
 * Record of a single styling invocation captured by {@link AuditStylePort}.
 */
export interface StyledCall {
  /** Which styling method was called. */
  method: 'styled' | 'rgb' | 'hex' | 'bold';
  /** The text that was styled. */
  text: string;
  /** The design-token value passed to `styled()`, if applicable. */
  token?: TokenValue;
  /** The color argument passed to `rgb()` or `hex()`, if applicable. */
  color?: string | RGB;
}

/**
 * Extended {@link StylePort} that records every call for test assertions.
 *
 * All styling methods return text unchanged (identity pass-through) so that
 * string equality assertions work without stripping escape codes. Use the
 * {@link calls} array or {@link wasStyled} helper to verify styling behavior.
 */
export interface AuditStylePort extends StylePort {
  /** All recorded style calls in order (defensive copy). */
  readonly calls: readonly StyledCall[];

  /**
   * Check whether a `styled()` call matched a given token and text substring.
   * @param token - The design-token value to match against (compared by hex and modifiers).
   * @param substring - A substring that must appear in the styled text.
   * @returns `true` if a matching `styled()` call was recorded.
   */
  wasStyled(token: TokenValue, substring: string): boolean;

  /** Clear all recorded calls. */
  reset(): void;
}

/**
 * Create a {@link StylePort} that records all styling calls for test assertions.
 *
 * Return text unchanged (like {@link plainStyle}) so existing string assertions
 * still work. Record every call for post-hoc assertion via the `calls` array
 * and the `wasStyled()` convenience method.
 *
 * @returns An {@link AuditStylePort} with an empty call log.
 */
export function auditStyle(): AuditStylePort {
  /** @internal Mutable backing array for recorded calls. */
  const _calls: StyledCall[] = [];

  return {
    get calls(): readonly StyledCall[] {
      return _calls.slice();
    },

    /**
     * Record a `styled()` call and return the text unchanged.
     * @param token - The design-token value.
     * @param text - The text to style.
     * @returns The original text, unmodified.
     */
    styled(token: TokenValue, text: string): string {
      _calls.push({ method: 'styled', text, token });
      return text;
    },

    /**
     * Record an `rgb()` call and return the text unchanged.
     * @param r - Red channel (0-255).
     * @param g - Green channel (0-255).
     * @param b - Blue channel (0-255).
     * @param text - The text to style.
     * @returns The original text, unmodified.
     */
    rgb(r: number, g: number, b: number, text: string): string {
      _calls.push({ method: 'rgb', text, color: [r, g, b] });
      return text;
    },

    /**
     * Record a `hex()` call and return the text unchanged.
     * @param color - Hex color string (e.g. `"#ff00aa"`).
     * @param text - The text to style.
     * @returns The original text, unmodified.
     */
    hex(color: string, text: string): string {
      _calls.push({ method: 'hex', text, color });
      return text;
    },

    /**
     * Record a `bold()` call and return the text unchanged.
     * @param text - The text to style.
     * @returns The original text, unmodified.
     */
    bold(text: string): string {
      _calls.push({ method: 'bold', text });
      return text;
    },

    /**
     * Check whether a `styled()` call matched a given token and text substring.
     * @param token - The design-token value to match (compared by hex and modifiers).
     * @param substring - A substring that must appear in the styled text.
     * @returns `true` if a matching `styled()` call was recorded.
     */
    wasStyled(token: TokenValue, substring: string): boolean {
      return _calls.some(
        (c) =>
          c.method === 'styled'
          && c.token?.hex === token.hex
          && JSON.stringify([...(c.token?.modifiers ?? [])].sort()) === JSON.stringify([...(token.modifiers ?? [])].sort())
          && c.text.includes(substring),
      );
    },

    /** Clear all recorded calls. */
    reset(): void {
      _calls.length = 0;
    },
  };
}
