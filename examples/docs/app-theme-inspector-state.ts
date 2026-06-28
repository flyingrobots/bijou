import type { Theme } from '../../packages/bijou/src/index.js';
import type { KeyMsg } from '../../packages/bijou-tui/src/index.js';
import { themePaletteRows } from './app-theme-token-model.js';

type ThemeInspectorKeyId =
  | 'G'
  | 'd'
  | 'down'
  | 'escape'
  | 'f10'
  | 'g'
  | 'j'
  | 'k'
  | 'pagedown'
  | 'pageup'
  | 'u'
  | 'up';
type ThemeInspectorScrollAnchorType = 'bottom' | 'top';

const THEME_INSPECTOR_KEYS = {
  bottom: 'G',
  close: 'escape',
  down: 'down',
  fastDown: 'j',
  fastUp: 'k',
  pageDown: 'pagedown',
  pageDownAlias: 'd',
  pageUp: 'pageup',
  pageUpAlias: 'u',
  toggle: 'f10',
  top: 'g',
  up: 'up',
} satisfies Readonly<Record<string, ThemeInspectorKeyId>>;
const SCROLL_BOTTOM = 'bottom' satisfies ThemeInspectorScrollAnchorType;
const SCROLL_TOP = 'top' satisfies ThemeInspectorScrollAnchorType;

export type ThemeInspectorScrollTarget = number | ThemeInspectorScrollAnchorType;

export function shouldToggleThemeInspector(msg: KeyMsg): boolean {
  return !msg.ctrl && !msg.alt && !msg.shift && msg.key === THEME_INSPECTOR_KEYS.toggle;
}

export function shouldCloseThemeInspector(msg: KeyMsg): boolean {
  return !msg.ctrl && !msg.alt && !msg.shift && msg.key === THEME_INSPECTOR_KEYS.close;
}

export function themeInspectorViewportHeight(rows: number): number {
  const drawerHeight = Math.max(8, rows - 4);
  return Math.max(1, drawerHeight - 2);
}

export function themeInspectorMaxScroll(rows: number, theme: Theme): number {
  return Math.max(0, themeInspectorContentHeight(theme) - themeInspectorViewportHeight(rows));
}

export function clampThemeInspectorScroll(
  rows: number,
  theme: Theme,
  scrollY: number,
): number {
  if (!Number.isFinite(scrollY)) return 0;
  return Math.max(0, Math.min(Math.floor(scrollY), themeInspectorMaxScroll(rows, theme)));
}

export function resolveThemeInspectorScrollY(
  currentScrollY: number,
  target: ThemeInspectorScrollTarget,
  rows: number,
  theme: Theme,
): number {
  if (target === SCROLL_TOP) return 0;
  if (target === SCROLL_BOTTOM) return themeInspectorMaxScroll(rows, theme);
  return currentScrollY + target;
}

export function themeInspectorDrawerWidth(columns: number): number {
  const availableWidth = Math.max(1, columns - 2);
  const preferredWidth = Math.min(64, Math.max(34, Math.floor(columns * 0.42)));
  return Math.max(1, Math.min(availableWidth, preferredWidth));
}

export function themeInspectorScrollTarget(
  msg: KeyMsg,
  viewportHeight: number,
): ThemeInspectorScrollTarget | undefined {
  if (msg.ctrl || msg.alt) return undefined;
  if (!msg.shift && (msg.key === THEME_INSPECTOR_KEYS.down || msg.key === THEME_INSPECTOR_KEYS.fastDown)) return 1;
  if (!msg.shift && (msg.key === THEME_INSPECTOR_KEYS.up || msg.key === THEME_INSPECTOR_KEYS.fastUp)) return -1;
  if (!msg.shift && (msg.key === THEME_INSPECTOR_KEYS.pageDown || msg.key === THEME_INSPECTOR_KEYS.pageDownAlias)) {
    return Math.max(1, viewportHeight - 2);
  }
  if (!msg.shift && (msg.key === THEME_INSPECTOR_KEYS.pageUp || msg.key === THEME_INSPECTOR_KEYS.pageUpAlias)) {
    return -Math.max(1, viewportHeight - 2);
  }
  if (!msg.shift && msg.key === THEME_INSPECTOR_KEYS.top) return SCROLL_TOP;
  if (msg.key === THEME_INSPECTOR_KEYS.bottom || (msg.shift && msg.key === THEME_INSPECTOR_KEYS.top)) {
    return SCROLL_BOTTOM;
  }
  return undefined;
}

function themeInspectorContentHeight(theme: Theme): number {
  return themePaletteRows(theme).length + 14;
}
