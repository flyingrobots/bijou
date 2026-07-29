import { parseHex } from '../render/packed-cell.js';
import type { RGB, Theme, TokenValue } from './tokens.js';
import { RATIO_PRECISION, RELATIVE_LUMINANCE_BLUE, RELATIVE_LUMINANCE_GREEN, RELATIVE_LUMINANCE_RED, RGB_MAX, SRGB_LINEAR_BREAKPOINT, SRGB_LINEAR_DIVISOR, SRGB_LINEAR_EXPONENT, SRGB_LINEAR_OFFSET, SRGB_LINEAR_SCALE, assertNonEmpty } from './doctor.part01.js';
import type { ThemeColorEntry, ThemeDoctorIssue, ThemeSafePair, ThemeSafePairBuilder, ThemeSafePairKind, ThemeSafePairOptions, ThemeTokenEntry } from './doctor.part01.js';

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

export function defineThemeSafePairs(): ThemeSafePairBuilder {
  return new MutableThemeSafePairBuilder();
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

function collectThemeTokens(theme: Theme): readonly ThemeTokenEntry[] {
  const entries: ThemeTokenEntry[] = [];
  collectSectionTokens(entries, 'status', theme.status);
  collectSectionTokens(entries, 'semantic', theme.semantic);
  collectSectionTokens(entries, 'border', theme.border);
  collectSectionTokens(entries, 'ui', theme.ui);
  collectSectionTokens(entries, 'surface', theme.surface);
  return entries;
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

function parseHexColor(color: string): RGB | undefined {
  const parsed = parseHex(color);
  if (parsed === undefined) {
    return undefined;
  }

  const [red, green, blue] = parsed;
  return [red, green, blue];
}

function isValidHexColor(color: string): boolean {
  return parseHexColor(color) !== undefined;
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

function normalizeColor(color: string): string {
  return color.toLowerCase();
}

function srgbChannelToLinear(channel: number): number {
  const normalized = channel / RGB_MAX;
  return normalized <= SRGB_LINEAR_BREAKPOINT
    ? normalized / SRGB_LINEAR_DIVISOR
    : ((normalized + SRGB_LINEAR_OFFSET) / SRGB_LINEAR_SCALE) ** SRGB_LINEAR_EXPONENT;
}

function relativeLuminance(rgb: RGB): number {
  const [red, green, blue] = rgb;
  return RELATIVE_LUMINANCE_RED * srgbChannelToLinear(red)
    + RELATIVE_LUMINANCE_GREEN * srgbChannelToLinear(green)
    + RELATIVE_LUMINANCE_BLUE * srgbChannelToLinear(blue);
}

function roundRatio(value: number): number {
  return Math.round(value * RATIO_PRECISION) / RATIO_PRECISION;
}

export { collectThemeColorEntries, collectThemeTokens, invalidColorIssue, isValidHexColor, normalizeColor, parseHexColor, relativeLuminance, roundRatio };
