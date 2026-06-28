import {
  hexToRgb,
  rgbToHex,
  type RGB,
  type Theme,
} from '../../packages/bijou/src/index.js';
import { cloneThemeForThemeLabEditor } from './app-theme-lab-editor-theme.js';
import { writeThemeLabEditableHex } from './app-theme-lab-editor-write.js';

export type ThemeLabEditorChannel = 0 | 1 | 2;
export type ThemeLabEditableTokenPath =
  | 'semantic.primary'
  | 'semantic.accent'
  | 'surface.primary.bg'
  | 'surface.secondary.bg'
  | 'border.primary'
  | 'ui.cursor'
  | 'status.success'
  | 'status.error';

export interface ThemeLabEditorState {
  readonly sourceThemeId: string;
  readonly selectedIndex: number;
  readonly channel: ThemeLabEditorChannel;
  readonly draftTheme: Theme;
}

export const THEME_LAB_CHANNEL_RED = 0 satisfies ThemeLabEditorChannel;
export const THEME_LAB_CHANNEL_GREEN = 1 satisfies ThemeLabEditorChannel;
export const THEME_LAB_CHANNEL_BLUE = 2 satisfies ThemeLabEditorChannel;

export const THEME_LAB_EDITABLE_PATHS: readonly ThemeLabEditableTokenPath[] = Object.freeze([
  'semantic.primary',
  'semantic.accent',
  'surface.primary.bg',
  'surface.secondary.bg',
  'border.primary',
  'ui.cursor',
  'status.success',
  'status.error',
]);

export function createThemeLabEditorState(sourceThemeId: string, theme: Theme): ThemeLabEditorState {
  return {
    sourceThemeId,
    selectedIndex: 0,
    channel: THEME_LAB_CHANNEL_RED,
    draftTheme: cloneThemeForThemeLabEditor(theme),
  };
}

export function themeLabEditorStateFor(
  sourceThemeId: string,
  theme: Theme,
  state: ThemeLabEditorState | undefined,
): ThemeLabEditorState {
  return state?.sourceThemeId === sourceThemeId ? state : createThemeLabEditorState(sourceThemeId, theme);
}

export function themeLabEditorSelectedPath(state: ThemeLabEditorState): ThemeLabEditableTokenPath {
  return THEME_LAB_EDITABLE_PATHS[clampIndex(state.selectedIndex)];
}

export function themeLabEditorSelectedHex(state: ThemeLabEditorState): string {
  return themeLabEditableHex(state.draftTheme, themeLabEditorSelectedPath(state));
}

export function themeLabEditableHex(theme: Theme, path: ThemeLabEditableTokenPath): string {
  switch (path) {
    case 'semantic.primary': return theme.semantic.primary.hex;
    case 'semantic.accent': return theme.semantic.accent.hex;
    case 'surface.primary.bg': return theme.surface.primary.bg ?? theme.surface.primary.hex;
    case 'surface.secondary.bg': return theme.surface.secondary.bg ?? theme.surface.secondary.hex;
    case 'border.primary': return theme.border.primary.hex;
    case 'ui.cursor': return theme.ui.cursor.hex;
    case 'status.success': return theme.status.success.hex;
    case 'status.error': return theme.status.error.hex;
  }
}

export function themeLabEditorSelectNext(state: ThemeLabEditorState, delta: number): ThemeLabEditorState {
  const count = THEME_LAB_EDITABLE_PATHS.length;
  return {
    ...state,
    selectedIndex: ((clampIndex(state.selectedIndex) + delta) % count + count) % count,
  };
}

export function themeLabEditorSelectChannel(
  state: ThemeLabEditorState,
  channel: ThemeLabEditorChannel,
): ThemeLabEditorState {
  return { ...state, channel };
}

export function themeLabEditorNudge(state: ThemeLabEditorState, delta: number): ThemeLabEditorState {
  const path = themeLabEditorSelectedPath(state);
  const rgb = hexToRgb(themeLabEditableHex(state.draftTheme, path));
  const channelIndex = channelIndexFor(state.channel);
  const nextRgb: RGB = [...rgb];
  const channelValue = nextRgb[channelIndex] ?? 0;
  nextRgb[channelIndex] = Math.max(0, Math.min(255, channelValue + delta));
  return {
    ...state,
    draftTheme: writeThemeLabEditableHex(state.draftTheme, path, rgbToHex(nextRgb)),
  };
}

export function themeLabEditorReset(state: ThemeLabEditorState, theme: Theme): ThemeLabEditorState {
  return {
    ...createThemeLabEditorState(state.sourceThemeId, theme),
    selectedIndex: clampIndex(state.selectedIndex),
    channel: state.channel,
  };
}

function channelIndexFor(channel: ThemeLabEditorChannel): number {
  return channel;
}

function clampIndex(index: number): number {
  if (!Number.isFinite(index)) return 0;
  return Math.max(0, Math.min(THEME_LAB_EDITABLE_PATHS.length - 1, Math.floor(index)));
}

export function themeLabEditorUpdateForKey(
  editor: ThemeLabEditorState,
  activeTheme: Theme,
  key: string,
): ThemeLabEditorState | undefined {
  if (key.length !== 1) return undefined;
  switch (key.charCodeAt(0)) {
    case 93: return themeLabEditorSelectNext(editor, 1);
    case 91: return themeLabEditorSelectNext(editor, -1);
    case 114: return themeLabEditorSelectChannel(editor, THEME_LAB_CHANNEL_RED);
    case 103: return themeLabEditorSelectChannel(editor, THEME_LAB_CHANNEL_GREEN);
    case 98: return themeLabEditorSelectChannel(editor, THEME_LAB_CHANNEL_BLUE);
    case 43:
    case 61: return themeLabEditorNudge(editor, 8);
    case 45: return themeLabEditorNudge(editor, -8);
    case 48: return themeLabEditorReset(editor, activeTheme);
    default: return undefined;
  }
}
