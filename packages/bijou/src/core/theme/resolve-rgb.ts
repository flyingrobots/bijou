import { populateTokenRGB } from './presets.js';
import type { Theme, TokenValue } from './tokens.js';

/** Walk all token values in a theme and populate fgRGB/bgRGB. */
export function populateThemeRGB(theme: Theme): void {
  const groups: (Record<string, TokenValue> | undefined)[] = [
    theme.status,
    theme.semantic,
    theme.border,
    theme.ui,
    theme.surface,
  ];
  for (const group of groups) {
    if (group == null) continue;
    for (const key of Object.keys(group)) {
      const token = group[key];
      if (token != null) populateTokenRGB(token);
    }
  }
}
