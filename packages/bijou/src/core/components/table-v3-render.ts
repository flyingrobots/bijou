import { isPackedSurface, type Cell, type Surface } from '../../ports/surface.js';
import { colorRgb, type ColorRef } from '../theme/color.js';
import { encodeModifiers } from '../render/packed-cell.js';
import { createTextSurface } from './surface-text.js';
import type { prepareTableSurface } from './table-v3-layout.js';

export function renderTableSurface(prepared: ReturnType<typeof prepareTableSurface>): Surface {
  const { columns, borderStyle, headerBg, colWidths, fittedHeaderSurfaces, headerHeight, fittedCellSurfaces, rowHeights, totalWidth, totalHeight, surface } = prepared;
  const packedSurface = isPackedSurface(surface) ? surface : undefined;

  // Pre-parse border style for setRGB fast path
  let bfR = -1, bfG = 0, bfB = 0, bbR = -1, bbG = 0, bbB = 0, bflags = 0;
  if (packedSurface) {
    const rgb = borderStyle.fgRGB ?? colorRgb(borderStyle.fg);
    if (rgb) { const [r, g, b] = rgb; bfR = r; bfG = g; bfB = b; }
  }
  if (packedSurface) {
    const rgb = borderStyle.bgRGB ?? colorRgb(borderStyle.bg);
    if (rgb) { const [r, g, b] = rgb; bbR = r; bbG = g; bbB = b; }
  }
  if (packedSurface) bflags = encodeModifiers(borderStyle.modifiers);

  const setBorder = (x: number, y: number, char: string, bg?: ColorRef): void => {
    if (packedSurface && !bg) {
      packedSurface.setRGB(x, y, char, bfR, bfG, bfB, bbR, bbG, bbB, bflags);
    } else {
      surface.set(x, y, { char, ...borderStyle, bg: bg ?? borderStyle.bg, empty: false });
    }
  };
  const setSpace = (x: number, y: number, bg?: Cell['bg'], fg?: Cell['fg']): void => {
    surface.set(x, y, {
      char: ' ',
      fg: fg ?? headerBg?.fg,
      bg: bg ?? headerBg?.bg,
      fgRGB: headerBg?.fgRGB,
      bgRGB: headerBg?.bgRGB,
      modifiers: headerBg?.modifiers,
      empty: false,
    });
  };

  const drawBorderRow = (y: number, left: string, mid: string, right: string): void => {
    if (columns.length === 0) {
      setBorder(0, y, left);
      setBorder(1, y, right);
      return;
    }

    let x = 0;
    setBorder(x++, y, left);
    for (let i = 0; i < colWidths.length; i++) {
      for (let j = 0; j < (colWidths[i] ?? 0) + 2; j++) setBorder(x++, y, '\u2500');
      setBorder(x++, y, i === colWidths.length - 1 ? right : mid);
    }
  };

  drawBorderRow(0, '\u250c', '\u252c', '\u2510');

  if (columns.length === 0) {
    for (let headerY = 0; headerY < headerHeight; headerY++) {
      setBorder(0, 1 + headerY, '\u2502', headerBg?.bg);
      setBorder(1, 1 + headerY, '\u2502', headerBg?.bg);
    }
    drawBorderRow(1 + headerHeight, '\u251c', '\u253c', '\u2524');
    drawBorderRow(totalHeight - 1, '\u2514', '\u2534', '\u2518');
    return surface;
  }

  for (let headerLine = 0; headerLine < headerHeight; headerLine++) {
    let headerX = 1;
    for (const [i, headerSurface] of fittedHeaderSurfaces.entries()) {
      const cellWidth = colWidths[i] ?? 0;
      for (let x = headerX; x < headerX + cellWidth + 2; x++) setSpace(x, 1 + headerLine);
      setBorder(headerX - 1, 1 + headerLine, '\u2502', headerBg?.bg);
      surface.blit(headerSurface, headerX + 1, 1 + headerLine, 0, headerLine, cellWidth, 1);
      headerX += cellWidth + 3;
    }
    setBorder(totalWidth - 1, 1 + headerLine, '\u2502', headerBg?.bg);
  }

  drawBorderRow(1 + headerHeight, '\u251c', '\u253c', '\u2524');

  let y = 2 + headerHeight;
  for (const [rowIndex, row] of fittedCellSurfaces.entries()) {
    const rowHeight = rowHeights[rowIndex] ?? 1;
    for (let line = 0; line < rowHeight; line++) {
      let x = 1;
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const cellWidth = colWidths[colIndex] ?? 0;
        setBorder(x - 1, y + line, '\u2502');
        for (let fillX = x; fillX < x + cellWidth + 2; fillX++) {
          if (packedSurface) packedSurface.setRGB(fillX, y + line, 0x20, -1, 0, 0, -1, 0, 0);
          else surface.set(fillX, y + line, { char: ' ', empty: false });
        }
        x += cellWidth + 3;
      }
      setBorder(totalWidth - 1, y + line, '\u2502');
    }
    let x = 1;
    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const cellWidth = colWidths[colIndex] ?? 0;
      const cellSurface = row[colIndex] ?? createTextSurface('');
      surface.blit(cellSurface, x + 1, y, 0, 0, cellWidth, rowHeight);
      x += cellWidth + 3;
    }
    y += rowHeight;
  }

  drawBorderRow(totalHeight - 1, '\u2514', '\u2534', '\u2518');
  return surface;
}
