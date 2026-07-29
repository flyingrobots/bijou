import type { TokenValue } from './tokens.js';

export type ThemeDoctorSeverity = 'warning' | 'error';

export type ThemeDoctorIssueKind =
  | 'invalid-color'
  | 'missing-token'
  | 'low-contrast'
  | 'color-reuse';

export interface ThemeContrastPair {
  readonly foreground: string;
  readonly background: string;
  readonly minRatio?: number;
  readonly label?: string;
}

export type ThemeSafePairKind = 'readable' | 'status' | 'chrome';

export interface ThemeSafePair extends ThemeContrastPair {
  readonly kind: ThemeSafePairKind;
}

export interface ThemeSafePairOptions {
  readonly minRatio?: number;
  readonly label?: string;
}

export interface ThemeSafePairBuilder {
  readable(foreground: string, background: string, options?: ThemeSafePairOptions): ThemeSafePairBuilder;
  status(foreground: string, background: string, options?: ThemeSafePairOptions): ThemeSafePairBuilder;
  chrome(foreground: string, background: string, options?: ThemeSafePairOptions): ThemeSafePairBuilder;
  build(): readonly ThemeSafePair[];
}

export interface ThemeDoctorOptions {
  readonly contrastPairs?: readonly ThemeContrastPair[];
  readonly minContrastRatio?: number;
  readonly maxColorReuse?: number;
}

export interface ThemeDoctorIssue {
  readonly severity: ThemeDoctorSeverity;
  readonly kind: ThemeDoctorIssueKind;
  readonly message: string;
  readonly path?: string;
  readonly color?: string;
  readonly foregroundPath?: string;
  readonly backgroundPath?: string;
  readonly ratio?: number;
  readonly minRatio?: number;
  readonly limit?: number;
  readonly count?: number;
  readonly paths?: readonly string[];
}

export interface ThemeDoctorReport {
  readonly themeName: string;
  readonly passed: boolean;
  readonly checkedTokenCount: number;
  readonly issues: readonly ThemeDoctorIssue[];
}

interface ThemeTokenEntry {
  readonly path: string;
  readonly token: TokenValue;
}

interface ColorUse {
  readonly path: string;
  readonly color: string;
}

interface ThemeColorEntry {
  readonly path: string;
  readonly color: string;
}

const DEFAULT_MIN_CONTRAST_RATIO = 4.5;

const RATIO_PRECISION = 100;

const RGB_MAX = 255;

const SRGB_LINEAR_BREAKPOINT = 0.03928;

const SRGB_LINEAR_DIVISOR = 12.92;

const SRGB_LINEAR_OFFSET = 0.055;

const SRGB_LINEAR_SCALE = 1.055;

const SRGB_LINEAR_EXPONENT = 2.4;

const RELATIVE_LUMINANCE_RED = 0.2126;

const RELATIVE_LUMINANCE_GREEN = 0.7152;

const RELATIVE_LUMINANCE_BLUE = 0.0722;

const CONTRAST_LUMINANCE_OFFSET = 0.05;

const MIN_REUSE_LIMIT = 1;

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}

export type { ColorUse, ThemeColorEntry, ThemeTokenEntry };
export { CONTRAST_LUMINANCE_OFFSET, DEFAULT_MIN_CONTRAST_RATIO, MIN_REUSE_LIMIT, RATIO_PRECISION, RELATIVE_LUMINANCE_BLUE, RELATIVE_LUMINANCE_GREEN, RELATIVE_LUMINANCE_RED, RGB_MAX, SRGB_LINEAR_BREAKPOINT, SRGB_LINEAR_DIVISOR, SRGB_LINEAR_EXPONENT, SRGB_LINEAR_OFFSET, SRGB_LINEAR_SCALE, assertNonEmpty };
