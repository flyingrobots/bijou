import { createSurface, isPackedSurface, type Surface } from '../../ports/surface.js';
import { FLAG_BOLD } from '../render/packed-cell.js';
import { colorRgb } from '../theme/color.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import { isPreparedPreferenceRow, preparePreferenceRow, resolvePreferenceRowLayout } from './preference-list.part01.js';
import type { PreferenceRow, PreferenceRowSurfaceOptions, PreparedPreferenceRow } from './preference-list.part01.js';
import { buildPreferenceLeftText, fillPreferenceRow, resolvePreferenceRowBg, resolvePreferenceRowBgRGB, writePreferenceLine } from './preference-list.part02.js';
import { resolvePreferenceValueStyle } from './preference-list.part03.js';

export function preferenceRowSurface(
  row: PreferenceRow | PreparedPreferenceRow,
  options: PreferenceRowSurfaceOptions,
): Surface {
  const ctx = resolveCtx(options.ctx);
  const width = Math.max(1, Math.floor(options.width));
  const prepared = isPreparedPreferenceRow(row) ? row : preparePreferenceRow(row);
  const layout = resolvePreferenceRowLayout(prepared, width);
  const surface = createSurface(width, layout.height);
  const bg = options.selected ? resolvePreferenceRowBg(ctx, options.theme) : undefined;
  const bgRGB = options.selected ? resolvePreferenceRowBgRGB(ctx, options.theme) : undefined;

  fillPreferenceRow(surface, bg, bgRGB);
  writePreferenceLine(surface, 0, buildPreferenceLeftText(prepared.row, options.selected === true), {
    strong: options.selected === true,
    bg,
    bgRGB,
  });

  if (layout.valueLabel.length > 0) {
    const valueStyle = resolvePreferenceValueStyle(prepared.row, ctx, options.theme);
    if (layout.stackValue) {
      writePreferenceLine(surface, 1, `   ${layout.valueLabel}`, {
        strong: true,
        ...valueStyle,
        bg,
        bgRGB,
      });
    } else {
      const valueChars = Array.from(layout.valueLabel);
      const startX = width >= 3 ? 1 : 0;
      const innerWidth = Math.max(0, width - (startX * 2));
      const valueStart = Math.max(0, innerWidth - valueChars.length);
      const packed = isPackedSurface(surface);
      if (packed && (valueStyle.fgRGB != null || valueStyle.fg != null)) {
        const fgP = valueStyle.fgRGB ?? colorRgb(valueStyle.fg);
        if (fgP) {
          const fR = fgP[0], fG = fgP[1], fB = fgP[2];
          let bR = -1, bG = 0, bB = 0;
          const bgP = bgRGB ?? colorRgb(bg);
          if (bgP) { bR = bgP[0]; bG = bgP[1]; bB = bgP[2]; }
          for (const [offset, char] of valueChars.entries()) {
            if (startX + valueStart + offset >= width) break;
            if (char === ' ') continue;
            (surface).setRGB(startX + valueStart + offset, 0, char, fR, fG, fB, bR, bG, bB, FLAG_BOLD);
          }
        } else {
          for (const [offset, char] of valueChars.entries()) {
            if (startX + valueStart + offset >= width) break;
            if (char === ' ') continue;
            surface.set(startX + valueStart + offset, 0, { char, ...valueStyle, bg, bgRGB, modifiers: ['bold'], empty: false });
          }
        }
      } else {
        for (const [offset, char] of valueChars.entries()) {
          if (startX + valueStart + offset >= width) break;
          if (char === ' ') continue;
          surface.set(startX + valueStart + offset, 0, { char, ...valueStyle, bg, bgRGB, modifiers: ['bold'], empty: false });
        }
      }
    }
  }

  for (const [index, descriptionLine] of layout.descriptionLines.entries()) {
    writePreferenceLine(
      surface,
      (layout.stackValue ? 2 : 1) + index,
      `   ${descriptionLine}`,
      {
        dim: options.theme?.descriptionToken == null,
        fg: options.theme?.descriptionToken?.hex,
        fgRGB: options.theme?.descriptionToken?.fgRGB,
        bg,
        bgRGB,
      },
    );
  }

  return surface;
}
