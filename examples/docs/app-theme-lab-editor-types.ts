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
