/**
 * Theme token type definitions for bijou terminal components.
 *
 * All colors are stored as #RRGGBB hex strings — deterministic across
 * terminals (unlike named ANSI colors which depend on terminal palette).
 */

export type RGB = [number, number, number];

export interface GradientStop {
  pos: number;
  color: RGB;
}

export type TextModifier = 'bold' | 'dim' | 'strikethrough' | 'inverse';

export interface TokenValue {
  hex: string;
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
  name: string;

  status: Record<S, TokenValue>;

  semantic: {
    success: TokenValue;
    error: TokenValue;
    warning: TokenValue;
    info: TokenValue;
    accent: TokenValue;
    muted: TokenValue;
    primary: TokenValue;
  };

  gradient: Record<G, GradientStop[]>;

  border: {
    primary: TokenValue;
    secondary: TokenValue;
    success: TokenValue;
    warning: TokenValue;
    error: TokenValue;
    muted: TokenValue;
  };

  ui: Record<U, TokenValue>;
}
