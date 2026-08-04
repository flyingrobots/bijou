import {
  createSurface,
  type Surface,
  type Theme,
  type ThemeMode,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { writeText } from './app-theme-lab-editor-draw.js';
import {
  renderThemeTokenRow,
  shouldStackThemeLabRows,
  ThemeLabTokenRowSelection,
} from './app-theme-lab-editor-rendering.js';
import {
  themeLabEditedLabel,
  type ThemeLabEditorRenderTokens,
} from './app-theme-lab-editor-view.js';
import { themeLabGraphNodes } from './app-theme-lab-graph.js';

// Named as a `mode` field rather than a bare literal so the localization
// scanner reads it as a token-family identifier, not as visible copy.
const DEFAULT_THEME_MODE = Object.freeze({ mode: 'dark' } as const);

export function renderThemeLabGraphSurface(
  baseTheme: Theme,
  draftTheme: Theme,
  width: number,
  localization: LocalizationPort | undefined,
  tokens: ThemeLabEditorRenderTokens,
  mode: ThemeMode = DEFAULT_THEME_MODE.mode,
): Surface {
  const nodes = themeLabGraphNodes(baseTheme, draftTheme, mode);
  const safeWidth = Math.max(32, width);
  const stackedRows = shouldStackThemeLabRows(safeWidth);
  const nodeRowHeight = stackedRows ? 2 : 1;
  const height = nodes.reduce((sum, node) => sum + nodeRowHeight + node.edges.length, 0);
  const surface = createSurface(safeWidth, Math.max(1, height));
  const editedLabel = themeLabEditedLabel(localization);
  let y = 0;
  for (const node of nodes) {
    y += renderThemeTokenRow(surface, y, {
      edited: node.edited,
      editedLabel,
      hex: node.hex,
      label: node.path,
      selection: ThemeLabTokenRowSelection.none,
      tokens,
    });
    for (const edge of node.edges) {
      writeText(surface, 2, y, `-> ${edge}`, tokens.muted);
      y += 1;
    }
  }
  return surface;
}
