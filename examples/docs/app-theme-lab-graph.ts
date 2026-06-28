import type { Theme } from '../../packages/bijou/src/index.js';
import {
  THEME_LAB_EDITABLE_PATHS,
  themeLabEditableHex,
  type ThemeLabEditableTokenPath,
} from './app-theme-lab-editor-model.js';

export interface ThemeLabGraphNode {
  readonly path: ThemeLabEditableTokenPath;
  readonly hex: string;
  readonly edited: boolean;
  readonly edges: readonly string[];
}

const THEME_LAB_GRAPH_EDGES: Readonly<Record<ThemeLabEditableTokenPath, readonly string[]>> = Object.freeze({
  'semantic.primary': Object.freeze([
    'surface.primary',
    'ui.tableHeader',
  ]),
  'semantic.accent': Object.freeze([
    'border.secondary',
    'ui.cursor',
    'ui.focusGutter',
    'status.active',
  ]),
  'surface.primary.bg': Object.freeze([
    'surface.primary',
    'ui.focusGutter.bg',
  ]),
  'surface.secondary.bg': Object.freeze([
    'surface.secondary',
  ]),
  'border.primary': Object.freeze([
    'ui.scrollThumb',
  ]),
  'ui.cursor': Object.freeze([
    'focus.current',
  ]),
  'status.success': Object.freeze([
    'border.success',
  ]),
  'status.error': Object.freeze([
    'border.error',
  ]),
});

export function themeLabGraphNodes(baseTheme: Theme, draftTheme: Theme): readonly ThemeLabGraphNode[] {
  return THEME_LAB_EDITABLE_PATHS.map((path) => {
    const baseHex = themeLabEditableHex(baseTheme, path);
    const draftHex = themeLabEditableHex(draftTheme, path);
    return {
      path,
      hex: draftHex,
      edited: baseHex !== draftHex,
      edges: THEME_LAB_GRAPH_EDGES[path],
    };
  });
}
