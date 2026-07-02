export const THEME_LAB_STACKED_ROW_WIDTH = 48;

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
