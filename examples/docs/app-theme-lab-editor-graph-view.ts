import {
  createSurface,
  type Surface,
  type Theme,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { writeText } from './app-theme-lab-editor-draw.js';
import {
  renderThemeTokenRow,
  shouldStackThemeLabRows,
} from './app-theme-lab-editor-rendering.js';
import {
  themeLabEditedLabel,
  type ThemeLabEditorRenderTokens,
} from './app-theme-lab-editor-view.js';
import { themeLabGraphNodes } from './app-theme-lab-graph.js';

export function renderThemeLabGraphSurface(
  baseTheme: Theme,
  draftTheme: Theme,
  width: number,
  localization: LocalizationPort | undefined,
  tokens: ThemeLabEditorRenderTokens,
): Surface {
  const nodes = themeLabGraphNodes(baseTheme, draftTheme);
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
      selection: 'none',
      tokens,
    });
    for (const edge of node.edges) {
      writeText(surface, 2, y, `-> ${edge}`, tokens.muted);
      y += 1;
    }
  }
  return surface;
}
