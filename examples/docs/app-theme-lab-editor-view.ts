import {
  createSurface,
  type Surface,
  type Theme,
  type TokenValue,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { themeLabGraphNodes } from './app-theme-lab-graph.js';
import {
  THEME_LAB_EDITABLE_PATHS,
  THEME_LAB_CHANNEL_BLUE,
  THEME_LAB_CHANNEL_GREEN,
  themeLabEditableHex,
  themeLabEditorSelectedPath,
  type ThemeLabEditorState,
} from './app-theme-lab-editor-model.js';
import { dogfoodLocalizedText } from './localization.js';

export interface ThemeLabEditorRenderTokens {
  readonly accent: TokenValue;
  readonly body: TokenValue;
  readonly muted: TokenValue;
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
): Surface {
  const safeWidth = Math.max(32, width);
  const surface = createSurface(safeWidth, THEME_LAB_EDITABLE_PATHS.length + 4);
  const selectedPath = themeLabEditorSelectedPath(state);
  writeText(surface, 0, 0, dogfoodText(localization, 'themeLab.editor.selected', 'Selected: {path}', {
    path: selectedPath,
  }), tokens.accent);
  writeText(surface, 0, 1, dogfoodText(localization, 'themeLab.editor.channel', 'Channel: {channel}', {
    channel: channelLabel(state.channel, localization),
  }), tokens.body);
  writeText(
    surface,
    0,
    2,
    dogfoodText(localization, 'themeLab.editor.controls', 'Controls: [/] color | r/g/b channel | -/+ nudge | 0 reset'),
    tokens.muted,
  );
  THEME_LAB_EDITABLE_PATHS.forEach((path, index) => {
    renderEditorRow(surface, index + 4, path, selectedPath, baseTheme, state, localization, tokens);
  });
  return surface;
}

export function renderThemeLabGraphSurface(
  baseTheme: Theme,
  draftTheme: Theme,
  width: number,
  localization: LocalizationPort | undefined,
  tokens: ThemeLabEditorRenderTokens,
): Surface {
  const nodes = themeLabGraphNodes(baseTheme, draftTheme);
  const height = nodes.reduce((sum, node) => sum + 1 + node.edges.length, 0);
  const surface = createSurface(Math.max(32, width), Math.max(1, height));
  let y = 0;
  for (const node of nodes) {
    renderSwatch(surface, node.hex, 0, y, 6);
    writeText(surface, 8, y, node.path, tokens.body);
    writeText(surface, Math.min(surface.width - 1, 34), y, node.hex, tokens.muted);
    if (node.edited) {
      writeText(surface, Math.min(surface.width - 1, 43), y, editedLabel(localization), tokens.accent);
    }
    y += 1;
    for (const edge of node.edges) {
      writeText(surface, 2, y, `-> ${edge}`, tokens.muted);
      y += 1;
    }
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
): void {
  const hex = themeLabEditableHex(state.draftTheme, path);
  const edited = themeLabEditableHex(baseTheme, path) !== hex;
  writeText(surface, 0, y, path === selectedPath ? '>' : ' ', tokens.accent);
  renderSwatch(surface, hex, 2, y, 6);
  writeText(surface, 10, y, path, path === selectedPath ? tokens.accent : tokens.body);
  writeText(surface, Math.min(surface.width - 1, 34), y, hex, tokens.muted);
  if (edited) {
    writeText(surface, Math.min(surface.width - 1, 43), y, editedLabel(localization), tokens.accent);
  }
}

function editedLabel(localization: LocalizationPort | undefined): string {
  return dogfoodText(localization, 'themeLab.editor.edited', 'edited');
}

function channelLabel(channel: ThemeLabEditorState['channel'], localization: LocalizationPort | undefined): string {
  switch (channel) {
    case 0: return dogfoodText(localization, 'themeLab.editor.channel.red', 'red');
    case THEME_LAB_CHANNEL_GREEN: return dogfoodText(localization, 'themeLab.editor.channel.green', 'green');
    case THEME_LAB_CHANNEL_BLUE: return dogfoodText(localization, 'themeLab.editor.channel.blue', 'blue');
  }
}

function renderSwatch(surface: Surface, hex: string, x: number, y: number, width: number): void {
  for (let offset = 0; offset < width && x + offset < surface.width; offset++) {
    surface.set(x + offset, y, {
      char: ' ',
      fg: hex,
      bg: hex,
      empty: false,
    });
  }
}

function writeText(surface: Surface, x: number, y: number, text: string, token: TokenValue): void {
  let index = 0;
  for (const char of text) {
    if (x + index >= surface.width) break;
    surface.set(x + index, y, {
      char,
      fg: token.hex,
      bg: token.bg,
      modifiers: token.modifiers,
      empty: false,
    });
    index += 1;
  }
}
