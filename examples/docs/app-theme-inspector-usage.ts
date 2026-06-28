import { createSurface, type Surface, type TokenValue } from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import type { ThemeInspectorChromeTokens } from './app-theme-inspector-chrome.js';
import { dogfoodLocalizedText } from './localization.js';

interface UsageProofRow {
  readonly labelId: string;
  readonly labelFallback: string;
  readonly path: string;
  readonly token: TokenValue;
}

function dogfoodText(
  localization: LocalizationPort | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return dogfoodLocalizedText(localization, id, fallback, values);
}

function writeText(surface: Surface, x: number, y: number, text: string, token: TokenValue): void {
  let index = 0;
  for (const char of text) {
    if (x + index >= surface.width) break;
    surface.set(x + index, y, {
      char,
      fg: token.hex,
      bg: token.bg,
      modifiers: token.modifiers,
      empty: false,
    });
    index += 1;
  }
}

export function renderThemeInspectorLine(text: string, width: number, token: TokenValue): Surface {
  const surface = createSurface(Math.max(1, width), 1);
  surface.fill({
    char: ' ',
    fg: token.hex,
    bg: token.bg,
    modifiers: token.modifiers,
    empty: false,
  });
  writeText(surface, 0, 0, text, token);
  return surface;
}

export function renderThemeInspectorSummary(
  activeLabel: string,
  themeName: string,
  safePairSummary: string,
  width: number,
  localization: LocalizationPort | undefined,
  chrome: ThemeInspectorChromeTokens,
): Surface {
  return stackLines([
    renderThemeInspectorLine(dogfoodText(localization, 'themeInspector.active', 'Active: {label}', {
      label: activeLabel,
    }), width, chrome.body),
    renderThemeInspectorLine(dogfoodText(localization, 'themeInspector.theme', 'Theme: {name}', {
      name: themeName,
    }), width, chrome.body),
    renderThemeInspectorLine(safePairSummary, width, chrome.muted),
  ]);
}

export function themeInspectorCloseHint(localization: LocalizationPort | undefined): string { return dogfoodText(localization, 'themeInspector.close', 'F10/Esc close • ↑/↓ scroll • q quit'); }
export function themeInspectorReferenceHeader(localization: LocalizationPort | undefined): string { return dogfoodText(localization, 'themeInspector.referenceHeader', 'Reference palette'); }
export function themeInspectorTitle(localization: LocalizationPort | undefined): string { return dogfoodText(localization, 'themeInspector.title', 'Theme Inspector'); }

export function renderThemeInspectorUsageProof(
  width: number,
  localization: LocalizationPort | undefined,
  chrome: ThemeInspectorChromeTokens,
): Surface {
  const rows: readonly UsageProofRow[] = [
    usageProofRow('themeInspector.usage.drawerBorder', 'drawer.border', 'docs.border.primary', chrome.border),
    usageProofRow('themeInspector.usage.drawerSurface', 'drawer.surface', 'docs.surface.panel', chrome.surface),
    usageProofRow('themeInspector.usage.summaryCopy', 'summary.copy', 'docs.text.description', chrome.muted),
    usageProofRow('themeInspector.usage.scrollThumb', 'scroll.thumb', 'shell.ui.scrollThumb', chrome.scrollThumb),
  ];
  const surface = createSurface(Math.max(1, width), rows.length + 1);
  surface.fill({
    char: ' ',
    fg: chrome.body.hex,
    bg: chrome.surface.bg,
    modifiers: chrome.body.modifiers,
    empty: false,
  });
  writeText(surface, 0, 0, dogfoodText(localization, 'themeInspector.usageHeader', 'DOGFOOD usage'), chrome.heading);
  rows.forEach((row, index) => {
    renderUsageProofRow(surface, index + 1, row, localization, chrome);
  });
  return surface;
}

function stackLines(lines: readonly Surface[]): Surface {
  const width = lines.reduce((max, line) => Math.max(max, line.width), 1);
  const surface = createSurface(width, Math.max(1, lines.length));
  lines.forEach((line, y) => {
    surface.blit(line, 0, y);
  });
  return surface;
}

function usageProofRow(
  labelId: string,
  labelFallback: string,
  path: string,
  token: TokenValue,
): UsageProofRow {
  return { labelId, labelFallback, path, token };
}

function renderUsageProofRow(
  surface: Surface,
  y: number,
  row: UsageProofRow,
  localization: LocalizationPort | undefined,
  chrome: ThemeInspectorChromeTokens,
): void {
  const swatchWidth = Math.min(8, Math.max(4, Math.floor(surface.width / 8)));
  renderSwatch(surface, row.token, 0, y, swatchWidth);
  const labelX = swatchWidth + 2;
  const pathX = Math.min(surface.width - 1, labelX + 15);
  const valueX = Math.min(surface.width - 1, pathX + 20);
  writeText(surface, labelX, y, dogfoodText(localization, row.labelId, row.labelFallback), chrome.body);
  writeText(surface, pathX, y, row.path, chrome.heading);
  writeText(surface, valueX, y, describeToken(row.token, localization), chrome.muted);
}

function renderSwatch(surface: Surface, token: TokenValue, x: number, y: number, width: number): void {
  const background = token.bg ?? token.hex;
  for (let offset = 0; offset < width; offset++) {
    surface.set(x + offset, y, { char: ' ', fg: token.hex, bg: background, empty: false });
  }
}

function describeToken(token: TokenValue, localization: LocalizationPort | undefined): string {
  if (token.bg === undefined) return token.hex;
  return dogfoodText(localization, 'themePalette.tokenWithBackground', '{foreground} on {background}', {
    foreground: token.hex,
    background: token.bg,
  });
}
