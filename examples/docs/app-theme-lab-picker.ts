import { createSurface, wrapToWidth, type Surface } from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import type { DocsShellThemeChoice } from './app-docs-shell-theme.js';
import { renderSwatch, writeText } from './app-theme-lab-editor-draw.js';
import type { ThemeLabEditorRenderTokens } from './app-theme-lab-editor-view.js';
import { dogfoodText } from './app-theme-lab-provenance-contract.js';

const SWATCH_WIDTH = 3;
const MARKER_WIDTH = 2;

/**
 * List every selectable shell theme, with the active one marked.
 *
 * This sits at the top of the Theme Lab because it is the control the page
 * exists to serve. It previously rendered last, roughly seventy rows below
 * the fold, which made a lab offering eight themes look like a lab offering
 * one.
 *
 * Each row carries swatches for the theme's surface, accent, and primary ink
 * so the list is scannable as colour rather than only as names.
 */
export function renderThemeLabPickerSurface(
  choices: readonly DocsShellThemeChoice[],
  activeId: string,
  width: number,
  tokens: ThemeLabEditorRenderTokens,
  localization?: LocalizationPort,
): Surface {
  const safeWidth = Math.max(1, width);
  const labelX = Math.min(MARKER_WIDTH + (3 * SWATCH_WIDTH) + 1, safeWidth - 1);
  const hint = wrapToWidth(dogfoodText(
    localization,
    'themeLab.picker.hint',
    'F2 opens the theme picker. {count} themes available.',
    { count: choices.length },
  ), safeWidth);
  const labels = choices.map((choice, index) =>
    wrapToWidth(`${String(index + 1)}. ${choice.label}`, safeWidth - labelX));
  const height = hint.length + labels.reduce((sum, rows) => sum + rows.length, 0);
  const surface = createSurface(safeWidth, Math.max(1, height));
  hint.forEach((line, y) => { writeText(surface, 0, y, line, tokens.muted); });
  let y = hint.length;
  choices.forEach((choice, index) => {
    const active = choice.id === activeId;
    writeText(surface, 0, y, active ? '* ' : '  ', tokens.accent);
    let swatchX = MARKER_WIDTH;
    for (const hex of swatchHexes(choice)) {
      renderSwatch(surface, hex, swatchX, y, SWATCH_WIDTH);
      swatchX += SWATCH_WIDTH;
    }
    const rows = labels[index] ?? [];
    rows.forEach((line, offset) => {
      writeText(surface, labelX, y + offset, line, active ? tokens.accent : tokens.body);
    });
    y += rows.length;
  });

  return surface;
}

function swatchHexes(choice: DocsShellThemeChoice): readonly string[] {
  const theme = choice.theme;
  return [
    theme.surface.primary.bg ?? theme.surface.primary.hex,
    theme.semantic.accent.hex,
    theme.semantic.primary.hex,
  ];
}
