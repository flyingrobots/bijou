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

export interface ThemeRuleCandidateScope {
  readonly kind: 'scope';
  readonly path: string;
  readonly not?: readonly string[];
}

export interface ThemeRuleCandidatePath {
  readonly kind: 'path';
  readonly path: string;
}

export interface ThemeRuleCandidateValue {
  readonly kind: 'value';
  readonly value: string;
  readonly label?: string;
}

export type ThemeRuleCandidateInput = string | ThemeRuleCandidatePath | ThemeRuleCandidateValue;
export type ThemeRuleCandidateSource = ThemeRuleCandidateScope | readonly ThemeRuleCandidateInput[];

interface ContrastRuleDefinition {
  readonly rule: 'best-contrast-with' | 'min-contrast-with';
  readonly target: ColorDefinition;
  readonly candidates: ThemeRuleCandidateSource;
  readonly ratio?: number;
}

interface VividRuleDefinition {
  readonly rule: 'most-vivid' | 'least-vivid';
  readonly candidates: ThemeRuleCandidateSource;
  readonly against?: ColorDefinition;
  readonly minContrast?: number;
  readonly not?: readonly string[];
}

interface ClosestRuleDefinition {
  readonly rule: 'closest-color';
  readonly target: ColorDefinition;
  readonly candidates: ThemeRuleCandidateSource;
}

interface NthRuleDefinition {
  readonly rule: 'nth-color';
  readonly candidates: ThemeRuleCandidateSource;
  readonly index: number;
}

export type ThemeColorRuleDefinition =
  | ContrastRuleDefinition
  | VividRuleDefinition
  | ClosestRuleDefinition
  | NthRuleDefinition;

export type ThemeRuleCandidateReason =
  | 'selected'
  | 'eligible'
  | 'excluded'
  | 'contrast-too-low'
  | 'not-selected'
  | 'invalid';

export interface ThemeRuleCandidateInspection {
  readonly path?: string;
  readonly label: string;
  readonly hex?: string;
  readonly ratio?: number;
  readonly score?: number;
  readonly reasons: readonly ThemeRuleCandidateReason[];
}

export interface ThemeRuleInspection {
  readonly kind: 'rule';
  readonly path: string;
  readonly mode: 'light' | 'dark';
  readonly rule: ThemeColorRuleDefinition['rule'];
  readonly hex: string;
  readonly selected?: ThemeRuleCandidateInspection;
  readonly candidates: readonly ThemeRuleCandidateInspection[];
  readonly dependencies: readonly string[];
}

export interface ThemeTokenInspection {
  readonly kind: 'token' | 'color';
  readonly path: string;
  readonly mode: 'light' | 'dark';
  readonly hex: string;
  readonly dependencies: readonly string[];
}

export type TokenGraphInspection = ThemeRuleInspection | ThemeTokenInspection;

/**
 * Union of possible input values for a token path.
 */
export type TokenInput = ColorDefinition | TokenDefinition | TokenValue | ThemeColorRuleDefinition;

/**
 * A flat or nested map of token definitions.
 */
export interface TokenDefinitions {
  [key: string]: TokenInput | TokenDefinitions;
}
