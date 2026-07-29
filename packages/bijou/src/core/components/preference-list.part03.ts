import { colorRgb } from '../theme/color.js';
import type { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import type { PreferenceColorStyle, PreferenceListTheme, PreferenceRow } from './preference-list.part01.js';

function resolvePreferenceValueStyle(
  row: PreferenceRow,
  ctx: ReturnType<typeof resolveCtx>,
  theme: PreferenceListTheme | undefined,
): PreferenceColorStyle {
  if (row.kind === 'toggle' && row.checked === true) {
    return {
      fg: theme?.toggleOnToken?.hex ?? ctx?.semantic('accent').hex,
      fgRGB: theme?.toggleOnToken?.fgRGB
        ?? colorRgb(theme?.toggleOnToken?.hex)
        ?? ctx?.semantic('accent').fgRGB,
    };
  }
  if (row.kind === 'toggle' && row.checked === false) {
    return {
      fg: theme?.toggleOffToken?.hex ?? ctx?.semantic('muted').hex,
      fgRGB: theme?.toggleOffToken?.fgRGB
        ?? colorRgb(theme?.toggleOffToken?.hex)
        ?? ctx?.semantic('muted').fgRGB,
    };
  }
  if (row.kind === 'choice') {
    return {
      fg: theme?.choiceToken?.hex ?? ctx?.semantic('accent').hex,
      fgRGB: theme?.choiceToken?.fgRGB
        ?? colorRgb(theme?.choiceToken?.hex)
        ?? ctx?.semantic('accent').fgRGB,
    };
  }
  if (row.kind === 'info' || row.kind === 'action') {
    return {
      fg: theme?.infoToken?.hex ?? ctx?.semantic('primary').hex,
      fgRGB: theme?.infoToken?.fgRGB
        ?? colorRgb(theme?.infoToken?.hex)
        ?? ctx?.semantic('primary').fgRGB,
    };
  }
  if (ctx == null) return {};
  return {
    fg: ctx.semantic('primary').hex,
    fgRGB: ctx.semantic('primary').fgRGB,
  };
}

export { resolvePreferenceValueStyle };
