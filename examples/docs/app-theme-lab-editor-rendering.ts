import {
  type Surface,
  type TokenValue,
} from '../../packages/bijou/src/index.js';
import { renderSwatch, writeText } from './app-theme-lab-editor-draw.js';

export const THEME_LAB_STACKED_ROW_WIDTH = 48;

export interface ThemeLabTokenRowRenderTokens {
  readonly accent: TokenValue;
  readonly body: TokenValue;
  readonly muted: TokenValue;
}

export const ThemeLabTokenRowSelection = Object.freeze({
  none: 0,
  selected: 1,
  unselected: 2,
});

export type ThemeLabTokenRowSelection =
  typeof ThemeLabTokenRowSelection[keyof typeof ThemeLabTokenRowSelection];

export interface ThemeLabTokenRowOptions {
  readonly edited: boolean;
  readonly editedLabel: string;
  readonly hex: string;
  readonly label: string;
  readonly selection: ThemeLabTokenRowSelection;
  readonly tokens: ThemeLabTokenRowRenderTokens;
}

export function shouldStackThemeLabRows(width: number): boolean {
  return width < THEME_LAB_STACKED_ROW_WIDTH;
}

export function hexWithEditedLabel(
  hex: string,
  edited: boolean,
  editedLabel: string,
): string {
  return edited ? `${hex} ${editedLabel}` : hex;
}

export function renderThemeTokenRow(
  surface: Surface,
  y: number,
  options: ThemeLabTokenRowOptions,
): number {
  const { edited, editedLabel, hex, label, selection, tokens } = options;
  const selected = selection === ThemeLabTokenRowSelection.selected;
  if (shouldStackThemeLabRows(surface.width)) {
    writeText(
      surface,
      0,
      y,
      stackedLabel(label, selection),
      selected ? tokens.accent : tokens.body,
    );
    renderSwatch(surface, hex, 2, y + 1, 6);
    writeText(
      surface,
      10,
      y + 1,
      hexWithEditedLabel(hex, edited, editedLabel),
      tokens.muted,
    );
    return 2;
  }

  if (selection === ThemeLabTokenRowSelection.none) {
    renderSwatch(surface, hex, 0, y, 6);
    writeText(surface, 8, y, label, tokens.body);
  } else {
    writeText(surface, 0, y, selected ? '>' : ' ', tokens.accent);
    renderSwatch(surface, hex, 2, y, 6);
    writeText(surface, 10, y, label, selected ? tokens.accent : tokens.body);
  }
  writeText(surface, Math.min(surface.width - 1, 34), y, hex, tokens.muted);
  if (edited) {
    writeText(surface, Math.min(surface.width - 1, 43), y, editedLabel, tokens.accent);
  }
  return 1;
}

function stackedLabel(label: string, selection: ThemeLabTokenRowSelection): string {
  if (selection === ThemeLabTokenRowSelection.none) {
    return label;
  }

  return selection === ThemeLabTokenRowSelection.selected ? `> ${label}` : `  ${label}`;
}
