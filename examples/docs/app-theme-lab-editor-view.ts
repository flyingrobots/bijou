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
  type ThemeLabTokenRowRenderTokens,
} from './app-theme-lab-editor-rendering.js';
import {
  THEME_LAB_EDITABLE_PATHS,
  THEME_LAB_CHANNEL_BLUE,
  THEME_LAB_CHANNEL_GREEN,
  themeLabEditableHex,
  themeLabEditorSelectedPath,
  type ThemeLabEditorState,
} from './app-theme-lab-editor-model.js';
import { dogfoodLocalizedText } from './localization.js';

export type ThemeLabEditorRenderTokens = ThemeLabTokenRowRenderTokens;

export interface ThemeLabEditorSurfaceOptions {
  readonly contextLines?: readonly string[];
}

function dogfoodText(
  localization: LocalizationPort | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return dogfoodLocalizedText(localization, id, fallback, values);
}

export function renderThemeLabEditorSurface(
  baseTheme: Theme,
  state: ThemeLabEditorState,
  width: number,
  localization: LocalizationPort | undefined,
  tokens: ThemeLabEditorRenderTokens,
  options: ThemeLabEditorSurfaceOptions = {},
): Surface {
  const safeWidth = Math.max(32, width);
  const contextLines = options.contextLines ?? [];
  const editorRowsStart = contextLines.length + 4;
  const stackedRows = shouldStackThemeLabRows(safeWidth);
  const editorRowHeight = stackedRows ? 2 : 1;
  const surface = createSurface(
    safeWidth,
    editorRowsStart + (THEME_LAB_EDITABLE_PATHS.length * editorRowHeight),
  );
  const selectedPath = themeLabEditorSelectedPath(state);
  contextLines.forEach((line, index) => {
    writeText(surface, 0, index, line, index === 0 ? tokens.accent : tokens.muted);
  });
  writeText(
    surface,
    0,
    contextLines.length,
    dogfoodText(localization, 'themeLab.editor.selected', 'Selected: {path}', {
      path: selectedPath,
    }),
    tokens.accent,
  );
  writeText(
    surface,
    0,
    contextLines.length + 1,
    dogfoodText(localization, 'themeLab.editor.channel', 'Channel: {channel}', {
      channel: channelLabel(state.channel, localization),
    }),
    tokens.body,
  );
  writeText(
    surface,
    0,
    contextLines.length + 2,
    dogfoodText(
      localization,
      'themeLab.editor.controls',
      'Controls: [/] color | r/g/b channel | -/+ nudge | 0 reset',
    ),
    tokens.muted,
  );
  let rowY = editorRowsStart;
  for (const path of THEME_LAB_EDITABLE_PATHS) {
    rowY += renderEditorRow(
      surface,
      rowY,
      path,
      selectedPath,
      baseTheme,
      state,
      localization,
      tokens,
    );
  }
  return surface;
}

function renderEditorRow(
  surface: Surface,
  y: number,
  path: (typeof THEME_LAB_EDITABLE_PATHS)[number],
  selectedPath: (typeof THEME_LAB_EDITABLE_PATHS)[number],
  baseTheme: Theme,
  state: ThemeLabEditorState,
  localization: LocalizationPort | undefined,
  tokens: ThemeLabEditorRenderTokens,
): number {
  const hex = themeLabEditableHex(state.draftTheme, path);
  const edited = themeLabEditableHex(baseTheme, path) !== hex;
  return renderThemeTokenRow(surface, y, {
    edited,
    editedLabel: themeLabEditedLabel(localization),
    hex,
    label: path,
    selection: path === selectedPath ? 'selected' : 'unselected',
    tokens,
  });
}

export function themeLabEditedLabel(localization: LocalizationPort | undefined): string {
  return dogfoodText(localization, 'themeLab.editor.edited', 'edited');
}
function channelLabel(
  channel: ThemeLabEditorState['channel'],
  localization: LocalizationPort | undefined,
): string {
  switch (channel) {
    case 0: return dogfoodText(localization, 'themeLab.editor.channel.red', 'red');
    case THEME_LAB_CHANNEL_GREEN: {
      return dogfoodText(localization, 'themeLab.editor.channel.green', 'green');
    }
    case THEME_LAB_CHANNEL_BLUE: {
      return dogfoodText(localization, 'themeLab.editor.channel.blue', 'blue');
    }
  }
}
