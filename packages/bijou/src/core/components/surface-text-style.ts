import type { Cell } from '../../ports/surface.js';
import { encodeModifiers } from '../render/packed-cell.js';
import { colorRgb } from '../theme/color.js';
import type { TokenValue } from '../theme/tokens.js';

export type CellTextStyle = Pick<
  Cell,
  'fg' | 'bg' | 'fgRGB' | 'bgRGB' | 'modifiers'
>;

export interface NumericCellTextStyle {
  readonly fgR: number;
  readonly fgG: number;
  readonly fgB: number;
  readonly fgSet: boolean;
  readonly bgR: number;
  readonly bgG: number;
  readonly bgB: number;
  readonly bgSet: boolean;
  readonly flags: number;
}

export function parseNumericCellTextStyle(
  style: CellTextStyle,
): NumericCellTextStyle | undefined {
  const foreground = style.fgRGB ?? colorRgb(style.fg);
  if (style.fg != null && foreground == null) return undefined;
  const background = style.bgRGB ?? colorRgb(style.bg);
  if (style.bg != null && background == null) return undefined;
  return {
    fgR: foreground?.[0] ?? 0,
    fgG: foreground?.[1] ?? 0,
    fgB: foreground?.[2] ?? 0,
    fgSet: foreground !== undefined,
    bgR: background?.[0] ?? 0,
    bgG: background?.[1] ?? 0,
    bgB: background?.[2] ?? 0,
    bgSet: background !== undefined,
    flags: encodeModifiers(style.modifiers),
  };
}

export function tokenToCellStyle(token: TokenValue | undefined): CellTextStyle {
  if (token == null) return {};
  const style: CellTextStyle = {
    fg: token.hex,
    bg: token.bg,
    modifiers: token.modifiers,
  };
  if (token.fgRGB) style.fgRGB = token.fgRGB;
  if (token.bgRGB) style.bgRGB = token.bgRGB;
  return style;
}
