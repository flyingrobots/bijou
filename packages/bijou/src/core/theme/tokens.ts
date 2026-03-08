/**
 * Theme token type definitions for bijou terminal components.
 *
 * All colors are stored as #RRGGBB hex strings — deterministic across
 * terminals (unlike named ANSI colors which depend on terminal palette).
 */

/** Red, green, blue channel values as a three-element tuple (0–255 each). */
export type RGB = [number, number, number];

/** A single color stop in a gradient, positioned at a normalized value (0–1). */
export interface GradientStop {
  /** Normalized position along the gradient (0 = start, 1 = end). */
  pos: number;
  /** RGB color at this stop. */
  color: RGB;
}

/**
 * Supported text style modifiers that can be applied alongside a color.
 *
 * - `'bold'` — bold/bright weight
 * - `'dim'` — faint/reduced intensity
 * - `'strikethrough'` — horizontal line through text
 * - `'inverse'` — swap foreground and background colors
 * - `'underline'` — standard single underline (SGR 4)
 * - `'curly-underline'` — wavy/curly underline (SGR 4:3, kitty/iTerm2/WezTerm/Windows Terminal)
 * - `'dotted-underline'` — dotted underline (SGR 4:4)
 * - `'dashed-underline'` — dashed underline (SGR 4:5)
 *
 * Underline variants gracefully degrade to standard underline in terminals
 * that don't support SGR sub-parameters.
 */
export type TextModifier = 'bold' | 'dim' | 'strikethrough' | 'inverse'
  | 'underline' | 'curly-underline' | 'dotted-underline' | 'dashed-underline';

/** A theme token value: a hex color with optional text modifiers. */
export interface TokenValue {
  /** Foreground color as a `#rrggbb` hex string. */
  hex: string;
  /** Optional background color as a `#rrggbb` hex string. */
  bg?: string;
  /** Optional text style modifiers to apply alongside the color. */
  modifiers?: TextModifier[];
}

/** Color returned for Ink components — `undefined` means "use default terminal color" (NO_COLOR). */
export type InkColor = string | undefined;

/** Universal status keys that ship with bijou. */
export type BaseStatusKey = 'success' | 'error' | 'warning' | 'info' | 'pending' | 'active' | 'muted';

/** Built-in UI element keys. */
export type BaseUiKey = 'cursor' | 'scrollThumb' | 'scrollTrack' | 'sectionHeader'
  | 'logo' | 'tableHeader' | 'trackEmpty';

/** Built-in gradient keys. */
export type BaseGradientKey = 'brand' | 'progress';

/**
 * Generic theme interface.
 *
 * - `S` — status keys (default: BaseStatusKey)
 * - `U` — UI element keys (default: BaseUiKey)
 * - `G` — gradient keys (default: BaseGradientKey)
 *
 * @example
 * ```ts
 * // Use built-in keys
 * const theme: Theme = { ... };
 *
 * // Extend with project-specific keys
 * type MyStatus = BaseStatusKey | 'DONE' | 'IN_PROGRESS';
 * const theme: Theme<MyStatus> = { ... };
 * ```
 */
export interface Theme<
  S extends string = BaseStatusKey,
  U extends string = BaseUiKey,
  G extends string = BaseGradientKey,
> {
  /** Human-readable theme name (used as a registry key in presets). */
  name: string;

  /** Status tokens mapped by status key (e.g. success, error). */
  status: Record<S, TokenValue>;

  /** Semantic color tokens for general-purpose UI coloring. */
  semantic: {
    success: TokenValue;
    error: TokenValue;
    warning: TokenValue;
    info: TokenValue;
    accent: TokenValue;
    muted: TokenValue;
    primary: TokenValue;
  };

  /** Named gradient definitions, each as an array of color stops. */
  gradient: Record<G, GradientStop[]>;

  /** Border color tokens for box and container outlines. */
  border: {
    primary: TokenValue;
    secondary: TokenValue;
    success: TokenValue;
    warning: TokenValue;
    error: TokenValue;
    muted: TokenValue;
  };

  /** UI element tokens (cursors, scroll bars, headers, etc.). */
  ui: Record<U, TokenValue>;

  /** Background surface tokens for panels, regions, and overlays. */
  surface: {
    /** Default content background. */
    primary: TokenValue;
    /** Secondary/sidebar background. */
    secondary: TokenValue;
    /** Elevated surface (cards, dropdowns). */
    elevated: TokenValue;
    /** Overlay/scrim background (modals, drawers). */
    overlay: TokenValue;
    /** Muted/disabled region background. */
    muted: TokenValue;
  };
}
