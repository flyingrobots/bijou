import type { ColorScheme, Theme } from '@flyingrobots/bijou';
import { detectColorScheme } from '@flyingrobots/bijou';
import type {
  NodeThemeEntry,
  NodeThemeOptions,
} from './options.js';
import { nodeRuntime } from './runtime.js';

const DISABLED_THEME_ENV_VAR = '__BIJOU_THEME_DISABLED__';

export interface ResolvedNodeThemeSelection {
  readonly fallbackTheme: Theme | undefined;
  readonly colorScheme: ColorScheme;
  readonly envVar: string | undefined;
  readonly presets: Record<string, Theme> | undefined;
}

export function resolveNodeThemeSelection(
  runtime: ReturnType<typeof nodeRuntime>,
  options: NodeThemeOptions,
): ResolvedNodeThemeSelection {
  const colorScheme = resolveRequestedColorScheme(runtime, options);
  const presets = mergeNodeThemePresets(options);
  const envVar = options.envVar;

  if (options.themeOverride !== undefined) {
    const match = options.themes?.find(
      (entry) => entry.id === options.themeOverride,
    );
    if (match !== undefined) {
      return {
        fallbackTheme: match.theme,
        colorScheme: inferThemeEntryScheme(match) ?? colorScheme,
        envVar: DISABLED_THEME_ENV_VAR,
        presets,
      };
    }
  }

  const selectionEnvVar = envVar ?? 'BIJOU_THEME';
  const envSelection = runtime.env(selectionEnvVar);
  if (envSelection !== undefined) {
    const match = options.themes?.find((entry) => entry.id === envSelection);
    if (match !== undefined) {
      return {
        fallbackTheme: match.theme,
        colorScheme: inferThemeEntryScheme(match) ?? colorScheme,
        envVar: DISABLED_THEME_ENV_VAR,
        presets,
      };
    }
    return {
      fallbackTheme:
        options.theme
        ?? resolveAutomaticThemeEntry(options, colorScheme)?.theme,
      colorScheme,
      envVar,
      presets,
    };
  }

  const automatic = resolveAutomaticThemeEntry(options, colorScheme);
  return {
    fallbackTheme: automatic?.theme ?? options.theme,
    colorScheme:
      automatic == null
        ? colorScheme
        : (inferThemeEntryScheme(automatic) ?? colorScheme),
    envVar,
    presets,
  };
}

function inferThemeEntryScheme(
  entry: NodeThemeEntry,
): ColorScheme | undefined {
  if (entry.scheme !== undefined) return entry.scheme;
  return entry.id === 'light' || entry.id === 'dark'
    ? entry.id
    : undefined;
}

function mergeNodeThemePresets(
  options: NodeThemeOptions,
): Record<string, Theme> | undefined {
  if (options.themes === undefined || options.themes.length === 0) {
    return options.presets;
  }
  const merged: Record<string, Theme> = { ...(options.presets ?? {}) };
  for (const entry of options.themes) {
    merged[entry.id] = entry.theme;
  }
  return merged;
}

function resolveRequestedColorScheme(
  runtime: ReturnType<typeof nodeRuntime>,
  options: NodeThemeOptions,
): ColorScheme {
  const mode = options.themeMode ?? 'auto';
  return mode === 'auto' ? detectColorScheme(runtime) : mode;
}

function resolveAutomaticThemeEntry(
  options: NodeThemeOptions,
  targetScheme: ColorScheme,
): NodeThemeEntry | undefined {
  if (options.themes === undefined || options.themes.length === 0) {
    return undefined;
  }
  return options.themes.find(
    (entry) => inferThemeEntryScheme(entry) === targetScheme,
  )
    ?? options.themes.find((entry) => entry.id === targetScheme)
    ?? options.themes[0];
}
