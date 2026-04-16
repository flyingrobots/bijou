import type { TokenValue, TextModifier } from './tokens.js';
import type { RGB } from './tokens.js';

/**
 * Color transformation operations supported by the token graph.
 */
export type ColorTransform =
  | { type: 'darken'; amount: number }
  | { type: 'lighten'; amount: number }
  | { type: 'saturate'; amount: number }
  | { type: 'desaturate'; amount: number }
  | { type: 'complementary' }
  | { type: 'mix'; with: string; ratio?: number }
  | { type: 'inverse' };

/**
 * A definition for a single token value.
 * Can be a raw hex string, a reference to another token, or a mode-specific choice.
 */
export type ColorDefinition =
  | string // raw hex: "#ff0000"
  | { ref: string; transform?: ColorTransform[] } // reference: { ref: "palette.brand" }
  | { light: ColorDefinition; dark: ColorDefinition }; // adaptive: { light: "#000", dark: "#fff" }

/**
 * A definition for a complete theme token (foreground, background, modifiers).
 */
export interface TokenDefinition {
  /** Foreground color definition. */
  fg: ColorDefinition;
  /** Optional background color definition. */
  bg?: ColorDefinition;
  /** Optional text style modifiers. */
  modifiers?: TextModifier[];
  /** Optional cached foreground RGB for direct-token imports. */
  fgRGB?: RGB;
  /** Optional cached background RGB for direct-token imports. */
  bgRGB?: RGB;
}

/**
 * Union of possible input values for a token path.
 */
export type TokenInput = ColorDefinition | TokenDefinition | TokenValue;

/**
 * A flat or nested map of token definitions.
 */
export interface TokenDefinitions {
  [key: string]: TokenInput | TokenDefinitions;
}
