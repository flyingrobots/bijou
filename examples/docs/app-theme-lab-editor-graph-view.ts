import {
  createSurface,
  type Surface,
  type Theme,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { renderSwatch, writeText } from './app-theme-lab-editor-draw.js';
import {
  hexWithEditedLabel,
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
    if (stackedRows) {
      writeText(surface, 0, y, node.path, tokens.body);
      renderSwatch(surface, node.hex, 2, y + 1, 6);
      writeText(surface, 10, y + 1, hexWithEditedLabel(node.hex, node.edited, editedLabel), tokens.muted);
      y += 2;
    } else {
      renderSwatch(surface, node.hex, 0, y, 6);
      writeText(surface, 8, y, node.path, tokens.body);
      writeText(surface, Math.min(surface.width - 1, 34), y, node.hex, tokens.muted);
      if (node.edited) {
        writeText(surface, Math.min(surface.width - 1, 43), y, editedLabel, tokens.accent);
      }
      y += 1;
    }
    for (const edge of node.edges) {
      writeText(surface, 2, y, `-> ${edge}`, tokens.muted);
      y += 1;
    }
  }
  return surface;
}
