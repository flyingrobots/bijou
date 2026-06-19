import type { Theme, TokenValue } from '../../packages/bijou/src/index.js';
import type { Rgb } from './app-landing.js';

export type ThemeTokenFamily = 'semantic' | 'surface' | 'border' | 'ui' | 'status' | 'gradient';

export interface ThemeTokenEntry {
  readonly family: ThemeTokenFamily;
  readonly path: string;
  readonly token?: TokenValue;
  readonly stops?: readonly string[];
}

export type ThemePaletteRow =
  | { readonly kind: 'group'; readonly label: string }
  | { readonly kind: 'token'; readonly entry: ThemeTokenEntry };

export const SURFACE_TOKEN_FAMILY = 'surface' satisfies ThemeTokenFamily;

function hexFromRgb([red, green, blue]: Rgb): string {
  return `#${[red, green, blue]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

function themeTokenRecordEntries(
  family: Exclude<ThemeTokenFamily, 'gradient'>,
  tokens: Record<string, TokenValue>,
): readonly ThemeTokenEntry[] {
  return Object.entries(tokens).map(([key, token]) => ({
    family,
    path: `${family}.${key}`,
    token,
  }));
}

export function themeTokenEntries(theme: Theme): readonly ThemeTokenEntry[] {
  return [
    ...themeTokenRecordEntries('semantic', theme.semantic),
    ...themeTokenRecordEntries('surface', theme.surface),
    ...themeTokenRecordEntries('border', theme.border),
    ...themeTokenRecordEntries('ui', theme.ui),
    ...themeTokenRecordEntries('status', theme.status),
    ...Object.entries(theme.gradient).map(([key, stops]) => ({
      family: 'gradient' as const,
      path: `gradient.${key}`,
      stops: stops.map((stop) => hexFromRgb(stop.color)),
    })),
  ];
}

export function themePaletteRows(theme: Theme): readonly ThemePaletteRow[] {
  const entries = themeTokenEntries(theme);
  const rows: ThemePaletteRow[] = [];
  for (const family of ['semantic', 'surface', 'border', 'ui', 'status', 'gradient'] as const) {
    rows.push({ kind: 'group', label: family });
    rows.push(...entries
      .filter((entry) => entry.family === family)
      .map((entry) => ({ kind: 'token' as const, entry })));
  }
  return rows;
}
