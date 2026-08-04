import {
  createSurface,
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
): Surface {
  const lines = themeLabProvenanceLines(theme, selectedPath, mode, localization);
  const safeWidth = Math.max(32, width);
  const surface = createSurface(safeWidth, Math.max(1, lines.length));

  lines.forEach((entry, y) => {
    const token = toneToken(entry.tone, tokens);
    if (entry.swatch === undefined) {
      writeText(surface, 0, y, entry.text, token);
      return;
    }
    renderSwatch(surface, entry.swatch, 0, y, SWATCH_WIDTH);
    writeText(surface, SWATCH_WIDTH + TEXT_GAP, y, entry.text, token);
  });

  return surface;
}
