import { parseHex } from '../render/packed-cell.js';
import type { RGB, Theme, TokenValue } from './tokens.js';

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

export function defineThemeSafePairs(): ThemeSafePairBuilder {
  return new MutableThemeSafePairBuilder();
}

export function doctorTheme(theme: Theme, options: ThemeDoctorOptions = {}): ThemeDoctorReport {
  const entries = collectThemeTokens(theme);
  const colorByPath = new Map(collectThemeColorEntries(entries).map((entry) => [entry.path, entry.color]));
  const issues: ThemeDoctorIssue[] = [];
  const colorUses: ColorUse[] = [];

  for (const entry of entries) {
    inspectToken(entry, options.minContrastRatio ?? DEFAULT_MIN_CONTRAST_RATIO, issues, colorUses);
  }

  for (const pair of options.contrastPairs ?? []) {
    inspectContrastPair(pair, colorByPath, options.minContrastRatio ?? DEFAULT_MIN_CONTRAST_RATIO, issues);
  }

  inspectColorReuse(colorUses, options.maxColorReuse, issues);

  return {
    themeName: theme.name,
    passed: issues.length === 0,
    checkedTokenCount: entries.length,
    issues,
  };
}

export function themeContrastRatio(foreground: string, background: string): number | undefined {
  const fg = parseHexColor(foreground);
  const bg = parseHexColor(background);
  if (fg === undefined || bg === undefined) {
    return undefined;
  }

  const lighter = Math.max(relativeLuminance(fg), relativeLuminance(bg));
  const darker = Math.min(relativeLuminance(fg), relativeLuminance(bg));
  return roundRatio((lighter + CONTRAST_LUMINANCE_OFFSET) / (darker + CONTRAST_LUMINANCE_OFFSET));
}

class MutableThemeSafePairBuilder implements ThemeSafePairBuilder {
  private readonly pairs: ThemeSafePair[] = [];

  readable(foreground: string, background: string, options: ThemeSafePairOptions = {}): ThemeSafePairBuilder {
    return this.add('readable', foreground, background, options);
  }

  status(foreground: string, background: string, options: ThemeSafePairOptions = {}): ThemeSafePairBuilder {
    return this.add('status', foreground, background, options);
  }

  chrome(foreground: string, background: string, options: ThemeSafePairOptions = {}): ThemeSafePairBuilder {
    return this.add('chrome', foreground, background, options);
  }

  build(): readonly ThemeSafePair[] {
    return Object.freeze(this.pairs.map(pair => Object.freeze({ ...pair })));
  }

  private add(
    kind: ThemeSafePairKind,
    foreground: string,
    background: string,
    options: ThemeSafePairOptions,
  ): ThemeSafePairBuilder {
    assertNonEmpty(foreground, 'Foreground token path');
    assertNonEmpty(background, 'Background token path');
    const duplicate = this.pairs.some(pair => pair.foreground === foreground && pair.background === background);
    if (duplicate) {
      throw new Error(`Duplicate theme safe pair ${foreground} on ${background}.`);
    }
    this.pairs.push({
      kind,
      foreground,
      background,
      ...(options.minRatio === undefined ? {} : { minRatio: options.minRatio }),
      ...(options.label === undefined ? {} : { label: options.label }),
    });
    return this;
  }
}

function collectThemeTokens(theme: Theme): readonly ThemeTokenEntry[] {
  const entries: ThemeTokenEntry[] = [];
  collectSectionTokens(entries, 'status', theme.status);
  collectSectionTokens(entries, 'semantic', theme.semantic);
  collectSectionTokens(entries, 'border', theme.border);
  collectSectionTokens(entries, 'ui', theme.ui);
  collectSectionTokens(entries, 'surface', theme.surface);
  return entries;
}

function collectSectionTokens(
  entries: ThemeTokenEntry[],
  section: string,
  tokens: Record<string, TokenValue>,
): void {
  for (const [name, token] of Object.entries(tokens)) {
    entries.push({ path: `${section}.${name}`, token });
  }
}

function collectThemeColorEntries(entries: readonly ThemeTokenEntry[]): readonly ThemeColorEntry[] {
  const colors: ThemeColorEntry[] = [];
  for (const entry of entries) {
    colors.push({ path: entry.path, color: entry.token.hex });
    if (entry.token.bg !== undefined) {
      colors.push({ path: `${entry.path}.bg`, color: entry.token.bg });
    }
  }
  return colors;
}

function inspectToken(
  entry: ThemeTokenEntry,
  minRatio: number,
  issues: ThemeDoctorIssue[],
  colorUses: ColorUse[],
): void {
  if (!isValidHexColor(entry.token.hex)) {
    issues.push(invalidColorIssue(entry.path, entry.token.hex));
  } else {
    colorUses.push({ path: entry.path, color: normalizeColor(entry.token.hex) });
  }

  if (entry.token.bg === undefined) {
    return;
  }

  const bgPath = `${entry.path}.bg`;
  if (!isValidHexColor(entry.token.bg)) {
    issues.push(invalidColorIssue(bgPath, entry.token.bg));
    return;
  }

  colorUses.push({ path: bgPath, color: normalizeColor(entry.token.bg) });
  inspectResolvedContrast(entry.path, bgPath, entry.token.hex, entry.token.bg, minRatio, issues);
}

function inspectContrastPair(
  pair: ThemeContrastPair,
  colorByPath: ReadonlyMap<string, string>,
  fallbackMinRatio: number,
  issues: ThemeDoctorIssue[],
): void {
  const foreground = colorByPath.get(pair.foreground);
  const background = colorByPath.get(pair.background);
  if (foreground === undefined) {
    issues.push(missingTokenIssue(pair.foreground));
    return;
  }
  if (background === undefined) {
    issues.push(missingTokenIssue(pair.background));
    return;
  }

  inspectResolvedContrast(
    pair.foreground,
    pair.background,
    foreground,
    background,
    pair.minRatio ?? fallbackMinRatio,
    issues,
  );
}

function inspectResolvedContrast(
  foregroundPath: string,
  backgroundPath: string,
  foreground: string,
  background: string,
  minRatio: number,
  issues: ThemeDoctorIssue[],
): void {
  const ratio = themeContrastRatio(foreground, background);
  if (ratio === undefined || ratio >= minRatio) {
    return;
  }

  issues.push({
    severity: 'warning',
    kind: 'low-contrast',
    foregroundPath,
    backgroundPath,
    ratio,
    minRatio,
    message: `${foregroundPath} on ${backgroundPath} contrast ${ratio} < ${minRatio}`,
  });
}

function inspectColorReuse(
  colorUses: readonly ColorUse[],
  maxColorReuse: number | undefined,
  issues: ThemeDoctorIssue[],
): void {
  if (maxColorReuse === undefined || maxColorReuse < MIN_REUSE_LIMIT) {
    return;
  }

  const usesByColor = new Map<string, string[]>();
  for (const use of colorUses) {
    const paths = usesByColor.get(use.color) ?? [];
    paths.push(use.path);
    usesByColor.set(use.color, paths);
  }

  for (const [color, paths] of usesByColor) {
    if (paths.length <= maxColorReuse) {
      continue;
    }

    issues.push({
      severity: 'warning',
      kind: 'color-reuse',
      color,
      limit: maxColorReuse,
      count: paths.length,
      paths,
      message: `${color} reused by ${paths.length} tokens (limit ${maxColorReuse})`,
    });
  }
}

function invalidColorIssue(path: string, color: string): ThemeDoctorIssue {
  return {
    severity: 'error',
    kind: 'invalid-color',
    path,
    color,
    message: `${path} has invalid color ${color}`,
  };
}

function missingTokenIssue(path: string): ThemeDoctorIssue {
  return {
    severity: 'error',
    kind: 'missing-token',
    path,
    message: `${path} is missing`,
  };
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}

function isValidHexColor(color: string): boolean {
  return parseHexColor(color) !== undefined;
}

function parseHexColor(color: string): RGB | undefined {
  const parsed = parseHex(color);
  if (parsed === undefined) {
    return undefined;
  }

  const [red, green, blue] = parsed;
  return [red, green, blue];
}

function normalizeColor(color: string): string {
  return color.toLowerCase();
}

function relativeLuminance(rgb: RGB): number {
  const [red, green, blue] = rgb;
  return RELATIVE_LUMINANCE_RED * srgbChannelToLinear(red)
    + RELATIVE_LUMINANCE_GREEN * srgbChannelToLinear(green)
    + RELATIVE_LUMINANCE_BLUE * srgbChannelToLinear(blue);
}

function srgbChannelToLinear(channel: number): number {
  const normalized = channel / RGB_MAX;
  return normalized <= SRGB_LINEAR_BREAKPOINT
    ? normalized / SRGB_LINEAR_DIVISOR
    : ((normalized + SRGB_LINEAR_OFFSET) / SRGB_LINEAR_SCALE) ** SRGB_LINEAR_EXPONENT;
}

function roundRatio(value: number): number {
  return Math.round(value * RATIO_PRECISION) / RATIO_PRECISION;
}
