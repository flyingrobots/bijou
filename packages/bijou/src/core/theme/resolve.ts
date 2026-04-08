import type { Theme, TokenValue, InkColor } from './tokens.js';
import type { RuntimePort } from '../../ports/runtime.js';
import type { WritePort } from '../../ports/io.js';
import { createEnvAccessor } from '../../ports/env.js';
import type { ColorScheme } from '../detect/tty.js';
import { detectColorScheme } from '../detect/tty.js';
import { PRESETS, CYAN_MAGENTA, populateTokenRGB } from './presets.js';
import { createTokenGraph, type TokenGraph } from './graph.js';
import type { TokenDefinitions } from './graph-types.js';

/** Walk all token values in a theme and populate fgRGB/bgRGB. */
function populateThemeRGB(theme: Theme): void {
  const groups: (Record<string, TokenValue> | undefined)[] = [
    theme.status,
    theme.semantic,
    theme.border,
    theme.ui,
    theme.surface,
  ];
  for (const group of groups) {
    if (!group) continue;
    for (const key of Object.keys(group)) {
      const token = group[key];
      if (token) populateTokenRGB(token);
    }
  }
}

/**
 * Check the no-color.org spec: `NO_COLOR` defined (any value) means no color.
 *
 * @param runtime - RuntimePort for reading env vars.
 * @returns True if the `NO_COLOR` environment variable is set.
 */
export function isNoColor(runtime: RuntimePort): boolean {
  const env = createEnvAccessor(runtime);
  return env('NO_COLOR') !== undefined;
}

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

/**
 * Create a ResolvedTheme from a Theme and a noColor flag.
 * @param theme - The theme to wrap.
 * @param noColor - Whether color output should be suppressed.
 * @param colorScheme - Terminal color scheme. Defaults to `'dark'`.
 * @returns ResolvedTheme with convenience accessors.
 */
export function createResolved(theme: Theme, noColor: boolean, colorScheme: ColorScheme = 'dark'): ResolvedTheme {
  populateThemeRGB(theme);
  const tokenGraph = createTokenGraph(theme as unknown as TokenDefinitions);

  return {
    theme,
    noColor,
    colorScheme,
    tokenGraph,

    ink(token: TokenValue): InkColor {
      return noColor ? undefined : token.hex;
    },

    inkStatus(status: string): InkColor {
      const token = theme.status[status as keyof typeof theme.status] as TokenValue | undefined;
      const fallback = theme.status['muted' as keyof typeof theme.status] as TokenValue | undefined;
      if (token === undefined) return noColor ? undefined : fallback?.hex;
      return noColor ? undefined : token.hex;
    },

    hex(token: TokenValue): string {
      return token.hex;
    },
  };
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

/**
 * Create a ThemeResolver that reads theme name from an env var and looks it up in a preset registry.
 * @param options - Resolver configuration (env var name, presets, fallback, runtime port).
 * @returns ThemeResolver with `getTheme`, `resolveTheme`, and `_resetForTesting` methods.
 */
export function createThemeResolver(options: ThemeResolverOptions): ThemeResolver {
  const envVar = options.envVar ?? 'BIJOU_THEME';
  const presets = options.presets ?? PRESETS;
  const fallback = options.fallback ?? CYAN_MAGENTA;
  const { runtime } = options;
  const warningPort = options.warningPort;

  const readEnv = createEnvAccessor(runtime);

  const warn = (message: string): void => {
    warningPort?.writeError(`${message}\n`);
  };

  let cached: ResolvedTheme | null = null;

  /** Return the lazily-cached resolved theme for the current environment. */
  function getTheme(): ResolvedTheme {
    if (cached !== null) return cached;

    const noColor = isNoColor(runtime);
    const colorScheme = detectColorScheme(runtime);
    const themeName = readEnv(envVar) ?? fallback.name;
    const theme = presets[themeName];

    if (theme === undefined) {
      warn(`[bijou] Unknown ${envVar}="${themeName}", falling back to "${fallback.name}".`);
      cached = createResolved(fallback, noColor, colorScheme);
    } else {
      cached = createResolved(theme, noColor, colorScheme);
    }

    return cached;
  }

  /** Resolve a theme by name (or env/fallback), bypassing the cache. */
  function resolveTheme(name?: string): ResolvedTheme {
    const noColor = isNoColor(runtime);
    const colorScheme = detectColorScheme(runtime);
    const themeName = name ?? readEnv(envVar) ?? fallback.name;
    const theme = presets[themeName];

    if (theme === undefined) {
      warn(`[bijou] Unknown theme "${themeName}", falling back to "${fallback.name}".`);
      return createResolved(fallback, noColor, colorScheme);
    }

    return createResolved(theme, noColor, colorScheme);
  }

  /** Clear the cached theme so the next `getTheme()` re-resolves. */
  function _resetForTesting(): void {
    cached = null;
  }

  return { getTheme, resolveTheme, _resetForTesting };
}
