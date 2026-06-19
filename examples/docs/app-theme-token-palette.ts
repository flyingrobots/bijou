import { createSurface, type Surface, type Theme, type TokenValue } from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { dogfoodLocalizedText } from './localization.js';
import { relativeLuminance } from './app-landing.js';
import { SURFACE_TOKEN_FAMILY, themePaletteRows, type ThemeTokenEntry } from './app-theme-token-model.js';

function dogfoodText(
  localization: LocalizationPort | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return dogfoodLocalizedText(localization, id, fallback, values);
}

function readableSwatchForeground(background: string): string {
  return relativeLuminance(background) > 0.46 ? '#111827' : '#f8fafc';
}

function writeSurfaceText(
  surface: Surface,
  x: number,
  y: number,
  text: string,
  token: TokenValue = { hex: '#f8fafc' },
): void {
  let index = 0;
  for (const char of text) {
    if (x + index >= surface.width) break;
    surface.set(x + index, y, {
      char,
      fg: token.hex,
      bg: token.bg,
      modifiers: token.modifiers,
    });
    index += 1;
  }
}

function renderSwatch(
  surface: Surface,
  entry: ThemeTokenEntry,
  x: number,
  y: number,
  width: number,
): void {
  if (entry.token !== undefined) {
    const background = entry.family === SURFACE_TOKEN_FAMILY && entry.token.bg !== undefined
      ? entry.token.bg
      : entry.token.hex;
    const foreground = entry.family === SURFACE_TOKEN_FAMILY
      ? entry.token.hex
      : readableSwatchForeground(background);
    for (let offset = 0; offset < width; offset++) {
      surface.set(x + offset, y, { char: ' ', fg: foreground, bg: background });
    }
    return;
  }

  const stops = entry.stops ?? ['#808080'];
  for (let offset = 0; offset < width; offset++) {
    const stopIndex = Math.min(
      stops.length - 1,
      Math.floor((offset / Math.max(1, width)) * stops.length),
    );
    const background = stops[stopIndex] ?? '#808080';
    surface.set(x + offset, y, {
      char: ' ',
      fg: readableSwatchForeground(background),
      bg: background,
    });
  }
}

function describeThemeToken(entry: ThemeTokenEntry, localization: LocalizationPort | undefined): string {
  if (entry.token !== undefined) {
    return entry.token.bg === undefined
      ? entry.token.hex
      : dogfoodText(localization, 'themePalette.tokenWithBackground', '{foreground} on {background}', {
        foreground: entry.token.hex,
        background: entry.token.bg,
      });
  }
  return (entry.stops ?? []).join(' -> ');
}

function foregroundOnlyToken(token: TokenValue): TokenValue { return { hex: token.hex, modifiers: token.modifiers }; }

function themePaletteChromeTokens(theme: Theme): {
  readonly group: TokenValue;
  readonly label: TokenValue;
  readonly value: TokenValue;
} {
  return {
    group: foregroundOnlyToken(theme.ui.sectionHeader),
    label: foregroundOnlyToken(theme.surface.primary),
    value: foregroundOnlyToken(theme.surface.muted),
  };
}

export function renderThemeTokenPalette(
  theme: Theme,
  width: number,
  localization: LocalizationPort | undefined,
  options: {
    readonly maxRows?: number;
    readonly chromeTheme?: Theme;
  } = {},
): Surface {
  const safeWidth = Math.max(24, width);
  const chrome = themePaletteChromeTokens(options.chromeTheme ?? theme);
  const rows = themePaletteRows(theme);
  const visibleRows = options.maxRows === undefined
    ? rows
    : rows.slice(0, Math.max(1, options.maxRows));
  const truncatedCount = Math.max(0, rows.length - visibleRows.length);
  const surface = createSurface(safeWidth, Math.max(1, visibleRows.length + (truncatedCount > 0 ? 1 : 0)));
  const swatchWidth = Math.min(8, Math.max(4, Math.floor(safeWidth / 8)));
  const labelX = swatchWidth + 2;

  visibleRows.forEach((row, y) => {
    if (row.kind === 'group') {
      writeSurfaceText(surface, 0, y, row.label.toUpperCase(), chrome.group);
      return;
    }
    renderSwatch(surface, row.entry, 0, y, swatchWidth);
    writeSurfaceText(surface, labelX, y, row.entry.path, chrome.label);
    writeSurfaceText(
      surface,
      Math.min(safeWidth - 1, labelX + 26),
      y,
      describeThemeToken(row.entry, localization),
      chrome.value,
    );
  });

  if (truncatedCount > 0) {
    writeSurfaceText(
      surface,
      0,
      surface.height - 1,
      dogfoodText(localization, 'themePalette.moreTokens', '... {count} more tokens', { count: truncatedCount }),
      chrome.value,
    );
  }

  return surface;
}
