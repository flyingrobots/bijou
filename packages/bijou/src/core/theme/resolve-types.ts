import type { Theme, TokenValue, InkColor } from './tokens.js';
import type { RuntimePort } from '../../ports/runtime.js';
import type { WritePort } from '../../ports/io.js';
import type { ColorScheme } from '../detect/tty.js';
import type { TokenGraph } from './graph.js';

/** A theme bundled with its noColor flag and convenience accessor methods. */
export interface ResolvedTheme {
  /** The underlying Theme object. */
  theme: Theme;
  /** Whether color output is disabled (per `NO_COLOR`). */
  noColor: boolean;
  /** Detected terminal color scheme (light or dark background). */
  colorScheme: ColorScheme;
  /** Reactive and Semantic Token Graph for advanced theming. */
  tokenGraph: TokenGraph;

  /**
   * Return a hex string for Ink's `color=` prop, or `undefined` when noColor.
   * @param token - Token to read the color from.
   * @returns Hex string or `undefined`.
   */
  ink(token: TokenValue): InkColor;

  /**
   * Return a hex string for a status key, or `undefined` when noColor.
   * @param status - Status key string to look up.
   * @returns Hex string or `undefined`.
   */
  inkStatus(status: string): InkColor;

  /**
   * Return the raw hex string from a token (for chalk.hex() or boxen borderColor).
   * @param token - Token to read the color from.
   * @returns Hex string.
   */
  hex(token: TokenValue): string;
}

/** Configuration options for creating a ThemeResolver. */
export interface ThemeResolverOptions {
  /** Environment variable name to read theme from. Default: `'BIJOU_THEME'`. */
  envVar?: string;
  /** Preset registry to look up theme names against. Default: bijou built-in PRESETS. */
  presets?: Record<string, Theme>;
  /** Fallback theme when env var / name doesn't match. Default: CYAN_MAGENTA. */
  fallback?: Theme;
  /** RuntimePort for reading env vars. */
  runtime: RuntimePort;
  /**
   * Optional output port for resolver warnings (unknown env/configured theme names).
   *
   * When omitted, resolver fallbacks remain silent.
   */
  warningPort?: Pick<WritePort, 'writeError'>;
}

/** A stateful theme resolver that caches the resolved theme and reads env vars. */
export interface ThemeResolver {
  /** Return the current resolved theme (cached singleton). */
  getTheme(): ResolvedTheme;
  /**
   * Resolve a theme by name, bypassing the singleton cache.
   * @param name - Theme name to look up. Falls back to env var, then the default.
   */
  resolveTheme(name?: string): ResolvedTheme;
  /** Reset the cached singleton. For tests only. */
  _resetForTesting(): void;
}
