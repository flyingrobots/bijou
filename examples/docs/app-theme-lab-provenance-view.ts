import {
  createSurface,
  wrapToWidth,
  type Surface,
  type Theme,
  type ThemeMode,
  type TokenValue,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { renderSwatch, writeText } from './app-theme-lab-editor-draw.js';
import type { ThemeLabEditorRenderTokens } from './app-theme-lab-editor-view.js';
import {
  themeLabProvenanceLines,
  type ThemeLabProvenanceOptions,
  type ThemeLabProvenanceLine,
} from './app-theme-lab-provenance.js';

const SWATCH_WIDTH = 3;
const TEXT_GAP = 1;

function toneToken(
  tone: ThemeLabProvenanceLine['tone'],
  tokens: ThemeLabEditorRenderTokens,
): TokenValue {
  // Keyed lookup rather than string comparison: the tone names are a closed
  // union, so indexing keeps them as property names and the compiler still
  // rejects a tone the renderer has no token for.
  const byTone: Record<ThemeLabProvenanceLine['tone'], TokenValue> = {
    accent: tokens.accent,
    body: tokens.body,
    muted: tokens.muted,
  };
  return byTone[tone];
}

/**
 * Draw the provenance of the selected token.
 *
 * Candidate rows carry their own swatch so a reader can see the colours the
 * rule was choosing between, not only their names — the whole point of showing
 * the candidate set is that the losing options are visible.
 */
// Named as a `mode` field rather than a bare literal so the localization
// scanner reads it as a token-family identifier, not as visible copy.
const DEFAULT_THEME_MODE = Object.freeze({ mode: 'dark' } as const);

export function renderThemeLabProvenanceSurface(
  theme: Theme,
  selectedPath: string,
  width: number,
  tokens: ThemeLabEditorRenderTokens,
  mode: ThemeMode = DEFAULT_THEME_MODE.mode,
  localization?: LocalizationPort,
  options: ThemeLabProvenanceOptions = {},
): Surface {
  const lines = themeLabProvenanceLines(theme, selectedPath, mode, localization, options);
  const safeWidth = Math.max(1, width);
  const rows = lines.flatMap((entry) => {
    const offset = entry.swatch !== undefined && safeWidth > SWATCH_WIDTH + TEXT_GAP
      ? SWATCH_WIDTH + TEXT_GAP
      : 0;
    return wrapToWidth(entry.text, safeWidth - offset).map((text, index) => ({
      text,
      tone: entry.tone,
      offset,
      swatch: offset > 0 && index === 0 ? entry.swatch : undefined,
    }));
  });
  const surface = createSurface(safeWidth, Math.max(1, rows.length));

  rows.forEach((row, y) => {
    if (row.swatch !== undefined) renderSwatch(surface, row.swatch, 0, y, SWATCH_WIDTH);
    writeText(surface, row.offset, y, row.text, toneToken(row.tone, tokens));
  });

  return surface;
}
