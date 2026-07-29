import { rgbToHex } from './color.js';
import type { RGB } from './tokens.js';

export type ThemeBuilderRequiredMode = 'dark' | 'light';

export type ThemeBuilderModeId = ThemeBuilderRequiredMode | (string & {});

export interface ThemeRgbObject {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export type ThemeColorInput = string | RGB | ThemeRgbObject;

export interface ThemeColorTokenValue {
  readonly hex: string;
  readonly rgb: RGB;
}

export interface TokenThemeMode {
  readonly id: string;
  readonly tokens: Readonly<Record<string, ThemeColorTokenValue>>;
}

export interface TokenTheme {
  readonly kind: 'bijou.token-theme';
  readonly id: string;
  readonly label?: string;
  readonly requiredModes: readonly ThemeBuilderRequiredMode[];
  readonly modes: Readonly<Record<string, TokenThemeMode>>;
  readonly tokenIds: readonly string[];
}

export interface ThemeTokenRef {
  readonly kind: 'bijou.theme-token-ref';
  readonly id: string;
}

export type ThemeColorRef = ThemeColorInput | ThemeTokenRef;

export interface ThemeModeBuilder {
  token(): ThemeModeTokenIdBuilder;
  token(id: string): ThemeModeTokenColorBuilder;
}

export interface ThemeModeTokenColorBuilder {
  color(value: ThemeColorInput): ThemeModeBuilder;
}

export interface ThemeModeTokenIdBuilder {
  id(id: string): ThemeModeTokenDraftBuilder;
}

export interface ThemeModeTokenDraftBuilder {
  color(value: ThemeColorInput): ThemeModeTokenRegistrationBuilder;
}

export interface ThemeModeTokenRegistrationBuilder {
  register(): ThemeModeBuilder;
}

export interface ThemeBuilder {
  id(id: string): ThemeBuilder;
  label(label: string): ThemeBuilder;
  mode(id: ThemeBuilderModeId, configure: (mode: ThemeModeBuilder) => void): ThemeBuilder;
  build(): TokenTheme;
}

export interface ResolveThemeColorRefOptions {
  readonly theme: TokenTheme;
  readonly mode: ThemeBuilderModeId;
  readonly unresolved?: 'throw' | 'fallback';
  readonly fallback?: ThemeColorInput;
}

interface ThemeTokenColorResolution {
  readonly source: 'theme';
  readonly themeId: string;
  readonly mode: string;
  readonly tokenId: string;
  readonly hex: string;
  readonly rgb: RGB;
  readonly fallback: false;
}

interface RawThemeColorResolution {
  readonly source: 'raw-color';
  readonly themeId: string;
  readonly mode: string;
  readonly hex: string;
  readonly rgb: RGB;
  readonly fallback: false;
}

interface FallbackThemeColorResolution {
  readonly source: 'fallback';
  readonly themeId: string;
  readonly mode: string;
  readonly tokenId: string;
  readonly hex: string;
  readonly rgb: RGB;
  readonly fallback: true;
}

export type ThemeColorResolution =
  | ThemeTokenColorResolution
  | RawThemeColorResolution
  | FallbackThemeColorResolution;

const REQUIRED_MODES: readonly ThemeBuilderRequiredMode[] = Object.freeze(['dark', 'light']);

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}

function tup(value: readonly number[]): RGB {
  const [r, g, b] = value;
  if (r === undefined || g === undefined || b === undefined || value.length !== 3
    || [r, g, b].some(channel => channel % 1 !== 0 || channel < 0 || channel > 255)) {
    throw new Error('RGB channels must be integers from 0 to 255');
  }
  return [r, g, b];
}

function dup(value: readonly number[]): RGB { return tup(value); }

function freezeColorValue(value: ThemeColorTokenValue): ThemeColorTokenValue {
  return Object.freeze({
    hex: value.hex,
    rgb: dup(value.rgb),
  });
}

function from(value: readonly number[]): ThemeColorTokenValue { const rgb = tup(value); return freezeColorValue({ hex: rgbToHex(rgb), rgb }); }

export { REQUIRED_MODES, assertNonEmpty, dup, freezeColorValue, from };
