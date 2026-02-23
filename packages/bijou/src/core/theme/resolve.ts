import type { Theme, TokenValue, InkColor } from './tokens.js';
import type { RuntimePort } from '../../ports/runtime.js';
import { PRESETS, CYAN_MAGENTA } from './presets.js';

/** Checks the no-color.org spec: NO_COLOR defined (any value) means no color. */
export function isNoColor(runtime?: RuntimePort): boolean {
  if (runtime) return runtime.env('NO_COLOR') !== undefined;
  return process.env['NO_COLOR'] !== undefined;
}

export interface ResolvedTheme {
  theme: Theme;
  noColor: boolean;

  /** Returns hex string for Ink `color=` prop, or undefined when noColor. */
  ink(token: TokenValue): InkColor;

  /** Returns hex string for a status key, or undefined when noColor. */
  inkStatus(status: string): InkColor;

  /** Returns the raw hex string from a token (for chalk.hex() or boxen borderColor). */
  hex(token: TokenValue): string;
}

export function createResolved(theme: Theme, noColor: boolean): ResolvedTheme {
  return {
    theme,
    noColor,

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

export interface ThemeResolverOptions {
  /** Environment variable name to read theme from. Default: 'BIJOU_THEME'. */
  envVar?: string;
  /** Preset registry. Default: bijou built-in PRESETS. */
  presets?: Record<string, Theme>;
  /** Fallback theme when env var / name doesn't match. Default: CYAN_MAGENTA. */
  fallback?: Theme;
  /** Optional RuntimePort for reading env vars. Falls back to process.env. */
  runtime?: RuntimePort;
}

export interface ThemeResolver {
  /** Returns the current resolved theme (cached singleton). */
  getTheme(): ResolvedTheme;
  /** Resolves a theme by name — bypasses the singleton cache. */
  resolveTheme(name?: string): ResolvedTheme;
  /** Resets the cached singleton. For tests only. */
  _resetForTesting(): void;
}

export function createThemeResolver(options: ThemeResolverOptions = {}): ThemeResolver {
  const envVar = options.envVar ?? 'BIJOU_THEME';
  const presets = options.presets ?? PRESETS;
  const fallback = options.fallback ?? CYAN_MAGENTA;
  const runtime = options.runtime;

  const readEnv = runtime
    ? (key: string) => runtime.env(key)
    : (key: string) => process.env[key];

  let cached: ResolvedTheme | null = null;

  function getTheme(): ResolvedTheme {
    if (cached !== null) return cached;

    const noColor = isNoColor(runtime);
    const themeName = readEnv(envVar) ?? fallback.name;
    const theme = presets[themeName];

    if (theme === undefined) {
      console.warn(`[bijou] Unknown ${envVar}="${themeName}", falling back to "${fallback.name}".`);
      cached = createResolved(fallback, noColor);
    } else {
      cached = createResolved(theme, noColor);
    }

    return cached;
  }

  function resolveTheme(name?: string): ResolvedTheme {
    const noColor = isNoColor(runtime);
    const themeName = name ?? readEnv(envVar) ?? fallback.name;
    const theme = presets[themeName];

    if (theme === undefined) {
      console.warn(`[bijou] Unknown theme "${themeName}", falling back to "${fallback.name}".`);
      return createResolved(fallback, noColor);
    }

    return createResolved(theme, noColor);
  }

  function _resetForTesting(): void {
    cached = null;
  }

  return { getTheme, resolveTheme, _resetForTesting };
}

// Default resolver — uses BIJOU_THEME env var and built-in presets.
const defaultResolver = createThemeResolver();

/** Returns the current resolved theme (singleton) using the default resolver. */
export function getTheme(): ResolvedTheme {
  return defaultResolver.getTheme();
}

/** Resolves a theme by name using the default resolver. */
export function resolveTheme(name?: string): ResolvedTheme {
  return defaultResolver.resolveTheme(name);
}

/** Resets the default resolver's cached singleton. For tests only. */
export function _resetThemeForTesting(): void {
  defaultResolver._resetForTesting();
}
