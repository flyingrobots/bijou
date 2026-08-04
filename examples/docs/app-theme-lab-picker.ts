import { createSurface, type Surface } from '../../packages/bijou/src/index.js';
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
  const safeWidth = Math.max(32, width);
  const surface = createSurface(safeWidth, Math.max(1, choices.length + 1));

  writeText(surface, 0, 0, dogfoodText(
    localization,
    'themeLab.picker.hint',
    'F2 opens the theme picker. {count} themes available.',
    { count: choices.length },
  ), tokens.muted);

  choices.forEach((choice, index) => {
    const y = index + 1;
    const active = choice.id === activeId;
    let x = 0;

    writeText(surface, x, y, active ? '* ' : '  ', tokens.accent);
    x += MARKER_WIDTH;

    for (const hex of swatchHexes(choice)) {
      renderSwatch(surface, hex, x, y, SWATCH_WIDTH);
      x += SWATCH_WIDTH;
    }

    x += 1;
    writeText(surface, x, y, `${String(index + 1)}. ${choice.label}`, active ? tokens.accent : tokens.body);
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
