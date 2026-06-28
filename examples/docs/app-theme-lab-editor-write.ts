import {
  hexToRgb,
  type Theme,
  type TokenValue,
} from '../../packages/bijou/src/index.js';
import type { ThemeLabEditableTokenPath } from './app-theme-lab-editor-model.js';
import { cloneThemeForThemeLabEditor } from './app-theme-lab-editor-theme.js';

export function writeThemeLabEditableHex(
  theme: Theme,
  path: ThemeLabEditableTokenPath,
  hex: string,
): Theme {
  const draft = cloneThemeForThemeLabEditor(theme);
  applyEditableHex(draft, path, hex);
  return draft;
}

function applyEditableHex(theme: Theme, path: ThemeLabEditableTokenPath, hex: string): void {
  switch (path) {
    case 'semantic.primary':
      theme.semantic.primary = tokenWithHex(theme.semantic.primary, hex);
      theme.surface.primary = tokenWithHex(theme.surface.primary, hex);
      theme.ui.tableHeader = tokenWithHex(theme.ui.tableHeader, hex);
      return;
    case 'semantic.accent':
      theme.semantic.accent = tokenWithHex(theme.semantic.accent, hex);
      theme.border.secondary = tokenWithHex(theme.border.secondary, hex);
      theme.ui.cursor = tokenWithHex(theme.ui.cursor, hex);
      theme.ui.focusGutter = tokenWithHex(theme.ui.focusGutter, hex);
      theme.ui.logo = tokenWithHex(theme.ui.logo, hex);
      theme.ui.sectionHeader = tokenWithHex(theme.ui.sectionHeader, hex);
      theme.status.active = tokenWithHex(theme.status.active, hex);
      return;
    case 'surface.primary.bg':
      theme.surface.primary = tokenWithBackground(theme.surface.primary, hex);
      theme.ui.focusGutter = tokenWithBackground(theme.ui.focusGutter, hex);
      return;
    case 'surface.secondary.bg':
      theme.surface.secondary = tokenWithBackground(theme.surface.secondary, hex);
      return;
    case 'border.primary':
      theme.border.primary = tokenWithHex(theme.border.primary, hex);
      theme.ui.scrollThumb = tokenWithHex(theme.ui.scrollThumb, hex);
      return;
    case 'ui.cursor':
      theme.ui.cursor = tokenWithHex(theme.ui.cursor, hex);
      return;
    case 'status.success':
      theme.status.success = tokenWithHex(theme.status.success, hex);
      theme.semantic.success = tokenWithHex(theme.semantic.success, hex);
      theme.border.success = tokenWithHex(theme.border.success, hex);
      return;
    case 'status.error':
      theme.status.error = tokenWithHex(theme.status.error, hex);
      theme.semantic.error = tokenWithHex(theme.semantic.error, hex);
      theme.border.error = tokenWithHex(theme.border.error, hex);
      return;
  }
}

function tokenWithHex(token: TokenValue, hex: string): TokenValue {
  return { ...token, hex, fgRGB: hexToRgb(hex) };
}

function tokenWithBackground(token: TokenValue, bg: string): TokenValue {
  return { ...token, bg, bgRGB: hexToRgb(bg) };
}
