import { isPackedSurface, type Surface } from '../../ports/surface.js';
import { rgbToHex } from '../theme/color.js';
import type { RGB } from '../theme/tokens.js';
import { resolveMarkRGB, type PlotMark } from './marks.js';
import type { ContinuousScale } from './scales.js';

export interface PlotLayout {
  readonly plotX: number;
  readonly plotY: number;
  readonly plotWidth: number;
  readonly plotHeight: number;
  readonly hasHeader: boolean;
  readonly showAxes: boolean;
}

export function formatTickValue(val: number): string {
  if (!Number.isFinite(val)) return '0';
  const abs = Math.abs(val);
  if (abs === 0) return '0';
  if (abs >= 1_000_000) return `${String(Number((val / 1_000_000).toFixed(1)))}M`;
  if (abs >= 10_000) return `${String(Number((val / 1_000).toFixed(0)))}k`;
  if (abs >= 1_000) return `${String(Number((val / 1_000).toFixed(1)))}k`;
  if (abs >= 100 || Number.isInteger(val)) return String(Math.round(val));
  if (abs >= 1) return String(Number(val.toFixed(1)));
  return String(Number(val.toFixed(2)));
}

export function writePlotText(surface: Surface, x: number, y: number, text: string, rgb: RGB): void {
  if (y < 0 || y >= surface.height) return;
  const packed = isPackedSurface(surface);
  const hex = packed ? undefined : rgbToHex(rgb);
  for (let i = 0; i < text.length; i++) {
    const cx = x + i;
    if (cx < 0 || cx >= surface.width) continue;
    const ch = text.charAt(i);
    if (packed && isPackedSurface(surface)) {
      surface.setRGB(cx, y, ch, rgb[0], rgb[1], rgb[2], -1, 0, 0);
    } else {
      surface.set(cx, y, { char: ch, fg: hex, fgRGB: rgb, empty: false });
    }
  }
}

export function computePlotLayout(
  width: number,
  height: number,
  yScale: ContinuousScale,
  hasHeader: boolean,
  showAxes: boolean,
): PlotLayout {
  const headerRows = hasHeader && height >= 4 ? 1 : 0;
  if (!showAxes || width < 10 || height - headerRows < 4) {
    return {
      plotX: 0,
      plotY: headerRows,
      plotWidth: Math.max(0, width),
      plotHeight: Math.max(0, height - headerRows),
      hasHeader: headerRows > 0,
      showAxes: false,
    };
  }
  const yTicks = yScale.ticks(Math.max(2, Math.floor((height - headerRows - 2) / 2)));
  let maxLabelWidth = 3;
  for (const t of yTicks) {
    const len = formatTickValue(t).length;
    if (len > maxLabelWidth) maxLabelWidth = len;
  }
  const marginLeft = Math.min(Math.floor(width / 3), maxLabelWidth + 2);
  return {
    plotX: marginLeft,
    plotY: headerRows,
    plotWidth: Math.max(1, width - marginLeft),
    plotHeight: Math.max(1, height - headerRows - 2),
    hasHeader: headerRows > 0,
    showAxes: true,
  };
}

export function renderGridAndAxes(
  surface: Surface,
  layout: PlotLayout,
  xScale: ContinuousScale,
  yScale: ContinuousScale,
  marks: readonly PlotMark[],
  options: {
    readonly title?: string;
    readonly legend?: boolean;
    readonly grid?: boolean;
    readonly axisRGB: RGB;
    readonly gridRGB: RGB;
    readonly titleRGB: RGB;
  },
): void {
  const { plotX, plotY, plotWidth, plotHeight, hasHeader, showAxes } = layout;
  if (hasHeader) {
    let cursorX = plotX;
    if (options.title) {
      writePlotText(surface, cursorX, 0, options.title, options.titleRGB);
      cursorX += options.title.length + 2;
    }
    if (options.legend) {
      for (const [i, m] of marks.entries()) {
        if (!m.label) continue;
        const pill = `● ${m.label}`;
        if (cursorX + pill.length <= surface.width) {
          writePlotText(surface, cursorX, 0, pill, resolveMarkRGB(m.stroke, i));
          cursorX += pill.length + 2;
        }
      }
    }
  }
  if (!showAxes) return;
  const yTicks = yScale.ticks(Math.max(2, Math.floor(plotHeight / 2)));
  const axisCol = plotX - 1;
  const axisBottom = plotY + plotHeight;
  for (let cy = plotY; cy < axisBottom; cy++) writePlotText(surface, axisCol, cy, '│', options.axisRGB);
  for (let cx = plotX; cx < plotX + plotWidth; cx++) writePlotText(surface, cx, axisBottom, '─', options.axisRGB);
  writePlotText(surface, axisCol, axisBottom, '└', options.axisRGB);

  const drawnRows = new Set<number>();
  for (const tick of yTicks) {
    const cy = plotY + Math.max(0, Math.min(plotHeight - 1, Math.floor(yScale(tick) / 4)));
    if (drawnRows.has(cy)) continue;
    drawnRows.add(cy);
    if (options.grid && cy < axisBottom) {
      for (let cx = plotX; cx < plotX + plotWidth; cx += 2) {
        if (surface.get(cx, cy).char === ' ') writePlotText(surface, cx, cy, '┄', options.gridRGB);
      }
    }
    writePlotText(surface, axisCol, cy, '┤', options.axisRGB);
    const label = formatTickValue(tick);
    writePlotText(surface, Math.max(0, axisCol - label.length), cy, label, options.axisRGB);
  }
  const [x0, x1] = xScale.domain();
  const leftLabel = formatTickValue(x0);
  const rightLabel = formatTickValue(x1);
  writePlotText(surface, plotX, axisBottom + 1, leftLabel, options.axisRGB);
  const rx = plotX + plotWidth - rightLabel.length;
  if (rx > plotX + leftLabel.length + 1) writePlotText(surface, rx, axisBottom + 1, rightLabel, options.axisRGB);
}
