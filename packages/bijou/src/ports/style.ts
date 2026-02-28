import type { TokenValue } from '../core/theme/tokens.js';

/**
 * Abstract styling port for applying color and text decoration.
 *
 * Adapters (e.g. bijou-node/chalk) implement this to translate
 * design-token values into terminal escape sequences.
 */
export interface StylePort {
  /** Apply a resolved design-token color/modifier to text. */
  styled(token: TokenValue, text: string): string;
  /** Apply a 24-bit RGB foreground color to text. */
  rgb(r: number, g: number, b: number, text: string): string;
  /** Apply a hex foreground color (e.g. `"#ff00aa"`) to text. */
  hex(color: string, text: string): string;
  /** Apply bold weight to text. */
  bold(text: string): string;
}
