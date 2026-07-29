import type { Theme, TokenValue, InkColor } from './tokens.js';
import type { RuntimePort } from '../../ports/runtime.js';
import { createEnvAccessor } from '../../ports/env.js';
import type { ColorScheme } from '../detect/tty.js';
import { detectColorScheme } from '../detect/tty.js';
import { PRESETS, CYAN_MAGENTA } from './presets.js';
import { createTokenGraph } from './graph.js';
import type { TokenDefinitions } from './graph-types.js';
import { ruleAuthoredDefinitions } from './preset-authoring.js';
import type {
  ResolvedTheme,
  ThemeResolverOptions,
  ThemeResolver,
} from './resolve-types.js';
import { populateThemeRGB } from './resolve-rgb.js';

/** Check no-color.org: `NO_COLOR` defined means no color. */
export function isNoColor(runtime: RuntimePort): boolean {
  const env = createEnvAccessor(runtime);
  return env('NO_COLOR') !== undefined;
}

/** Create a ResolvedTheme from a Theme and noColor flag. */
export function createResolved(
  theme: Theme,
  noColor: boolean,
  colorScheme: ColorScheme = 'dark',
): ResolvedTheme {
  populateThemeRGB(theme);
  const tokenGraph = createTokenGraph(
    ruleAuthoredDefinitions(theme) ?? themeTokenDefinitions(theme),
  );
  const statusTokens = new Map(Object.entries(theme.status));

  return {
    theme,
    noColor,
    colorScheme,
    tokenGraph,

    ink(token: TokenValue): InkColor {
      return noColor ? undefined : token.hex;
    },

    inkStatus(status: string): InkColor {
      const token = statusTokens.get(status);
      const fallback = statusTokens.get('muted');
      if (token === undefined) return noColor ? undefined : fallback?.hex;
      return noColor ? undefined : token.hex;
    },

    hex(token: TokenValue): string {
      return token.hex;
    },
  };
}

function themeTokenDefinitions(theme: Theme): TokenDefinitions {
  return {
    border: theme.border,
    semantic: theme.semantic,
    status: theme.status,
    surface: theme.surface,
    ui: theme.ui,
  };
}

/**
 * Create a ThemeResolver that reads theme name from an env var and looks it up in a preset registry.
 * @param options - Resolver configuration (env var name, presets, fallback, runtime port).
 * @returns ThemeResolver with `getTheme`, `resolveTheme`, and `_resetForTesting` methods.
 */
export function createThemeResolver(
  options: ThemeResolverOptions,
): ThemeResolver {
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
      warn(
        `[bijou] Unknown ${envVar}="${themeName}", falling back to "${fallback.name}".`,
      );
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
      warn(
        `[bijou] Unknown theme "${themeName}", falling back to "${fallback.name}".`,
      );
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
export type {
  ResolvedTheme,
  ThemeResolverOptions,
  ThemeResolver,
} from './resolve-types.js';
