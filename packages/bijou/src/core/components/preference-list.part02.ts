import { isPackedSurface, type Surface } from '../../ports/surface.js';
import { FLAG_BOLD, FLAG_DIM } from '../render/packed-cell.js';
import { colorRgb } from '../theme/color.js';
import type { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import { preferenceRowGlyph } from './preference-list.part01.js';
import type { PreferenceColorStyle, PreferenceListTheme, PreferenceRow } from './preference-list.part01.js';

function resolvePreferenceRowBg(
  ctx: ReturnType<typeof resolveCtx>,
  theme: PreferenceListTheme | undefined,
): string | undefined {
  if (theme?.selectedRowBgToken != null) {
    return theme.selectedRowBgToken.bg ?? theme.selectedRowBgToken.hex;
  }
  return ctx?.surface('elevated').bg
    ?? ctx?.surface('secondary').bg
    ?? ctx?.surface('muted').bg;
}

function resolvePreferenceRowBgRGB(
  ctx: ReturnType<typeof resolveCtx>,
  theme: PreferenceListTheme | undefined,
): readonly [number, number, number] | undefined {
  if (theme?.selectedRowBgToken != null) {
    return theme.selectedRowBgToken.bgRGB
      ?? colorRgb(theme.selectedRowBgToken.bg ?? theme.selectedRowBgToken.hex);
  }
  return ctx?.surface('elevated').bgRGB
    ?? ctx?.surface('secondary').bgRGB
    ?? ctx?.surface('muted').bgRGB;
}

function fillPreferenceRow(
  surface: Surface,
  bg: string | undefined,
  bgRGB: readonly [number, number, number] | undefined,
): void {
  if (bg == null && bgRGB == null) return;
  surface.fill({ char: ' ', bg, bgRGB, empty: false });
}

function writePreferenceLine(
  surface: Surface,
  y: number,
  text: string,
  options: {
    readonly strong?: boolean;
    readonly dim?: boolean;
    readonly fg?: string;
    readonly bg?: string;
    readonly fgRGB?: readonly [number, number, number];
    readonly bgRGB?: readonly [number, number, number];
  } = {},
): void {
  const chars = Array.from(text);
  const pp = isPackedSurface(surface);
  if (pp && (options.fgRGB != null || options.fg != null)) {
    const fgP = options.fgRGB ?? colorRgb(options.fg);
    if (fgP) {
      const fR = fgP[0], fG = fgP[1], fB = fgP[2];
      let bR = -1, bG = 0, bB = 0;
      const bgP = options.bgRGB ?? colorRgb(options.bg);
      if (bgP) { bR = bgP[0]; bG = bgP[1]; bB = bgP[2]; }
      const flags = options.strong ? FLAG_BOLD : options.dim ? FLAG_DIM : 0;
      for (const [x, char] of chars.entries()) {
        if (x >= surface.width) break;
        if (char === ' ') continue;
        (surface).setRGB(x, y, char, fR, fG, fB, bR, bG, bB, flags);
      }
      return;
    }
  }
  for (const [x, char] of chars.entries()) {
    if (x >= surface.width) break;
    if (char === ' ') continue;
    surface.set(x, y, {
      char,
      fg: options.fg,
      bg: options.bg,
      fgRGB: options.fgRGB,
      bgRGB: options.bgRGB,
      modifiers: options.strong ? ['bold'] : options.dim ? ['dim'] : undefined,
      empty: false,
    });
  }
}

function buildPreferenceLeftText(row: PreferenceRow, selected: boolean): string {
  const prefix = selected ? '›' : ' ';
  return `${prefix} ${preferenceRowGlyph(row)} ${row.label}`;
}

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

export {
  buildPreferenceLeftText,
  fillPreferenceRow,
  resolvePreferenceRowBg,
  resolvePreferenceRowBgRGB,
  resolvePreferenceValueStyle,
  writePreferenceLine,
};
