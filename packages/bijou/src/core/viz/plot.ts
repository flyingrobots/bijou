import { createSurface, type Surface } from '../../ports/surface.js';
import type { BijouNodeOptions } from '../components/types.js';
import { surfaceToString } from '../render/differ.js';
import { resolveSafeCtx } from '../resolve-ctx.js';
import type { RGB } from '../theme/tokens.js';
import { computePlotLayout, renderGridAndAxes, writePlotText } from './axes.js';
import { BrailleCanvas } from './braille-canvas.js';
import { resolveMarkRGB, type BarYMark, type PlotMark } from './marks.js';
import { inferPlotDomains, renderAccessiblePlot, renderPipePlot, surfaceToPlainString } from './plot-lower.js';
import { scaleLinear, type ContinuousScale } from './scales.js';

const BLOCK_EIGHTHS: readonly string[] = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

export interface PlotOptions extends BijouNodeOptions {
  readonly width: number;
  readonly height: number;
  readonly marks: readonly PlotMark[];
  readonly x?: ContinuousScale;
  readonly y?: ContinuousScale;
  readonly title?: string;
  readonly grid?: boolean;
  readonly legend?: boolean;
  readonly axes?: boolean;
}

function renderBarMarks(
  surface: Surface,
  bars: readonly { readonly mark: BarYMark; readonly rgb: RGB }[],
  plotX: number,
  plotY: number,
  plotWidth: number,
  plotHeight: number,
  xScale: ContinuousScale,
  yScale: ContinuousScale,
): void {
  const totalEighths = plotHeight * 8;
  const [yMin, yMax] = yScale.domain();
  const ySpan = yMax - yMin;
  if (ySpan === 0) return;
  for (const { mark, rgb } of bars) {
    for (const pt of mark.points) {
      const px = xScale(pt.x);
      const cx = plotX + Math.max(0, Math.min(plotWidth - 1, Math.floor(px / 2)));
      const norm = Math.max(0, Math.min(1, (pt.y - Math.min(yMin, yMax)) / Math.abs(ySpan)));
      let rem = Math.round(norm * totalEighths);
      for (let row = plotHeight - 1; row >= 0 && rem > 0; row--) {
        const step = Math.min(8, rem);
        writePlotText(surface, cx, plotY + row, BLOCK_EIGHTHS[step] ?? '█', rgb);
        rem -= step;
      }
    }
  }
}

export function plotSurface(options: PlotOptions): Surface {
  const width = Math.max(0, Math.floor(options.width));
  const height = Math.max(0, Math.floor(options.height));
  const surface = createSurface(width, height);
  if (width === 0 || height === 0) return surface;

  const ctx = resolveSafeCtx(options.ctx);
  const inferred = inferPlotDomains(options.marks);
  const xScale = options.x ? options.x.clone() : scaleLinear(inferred.xDomain);
  const yScale = options.y ? options.y.clone() : scaleLinear(inferred.yDomain).nice(4);
  const hasLegendLabels = (options.legend ?? true) && options.marks.some((m) => Boolean(m.label));
  const hasHeader = Boolean(options.title) || hasLegendLabels;
  const layout = computePlotLayout(width, height, yScale, hasHeader, options.axes ?? true);

  const canvas = new BrailleCanvas(layout.plotWidth, layout.plotHeight);
  xScale.range([0, Math.max(0, canvas.pixelWidth - 1)]);
  yScale.range([Math.max(0, canvas.pixelHeight - 1), 0]);

  const axisRGB: RGB = ctx?.semantic('muted').fgRGB ?? [148, 163, 184];
  const gridRGB: RGB = ctx?.border('muted').fgRGB ?? [71, 85, 105];
  const titleRGB: RGB = ctx?.semantic('primary').fgRGB ?? [226, 232, 240];

  renderGridAndAxes(surface, layout, xScale, yScale, options.marks, {
    title: options.title, legend: options.legend ?? true, grid: options.grid ?? true, axisRGB, gridRGB, titleRGB,
  });

  const barMarks: { readonly mark: BarYMark; readonly rgb: RGB }[] = [];
  for (const [i, mark] of options.marks.entries()) {
    const rgb = resolveMarkRGB(mark.stroke, i);
    if (mark.kind === 'barY') {
      barMarks.push({ mark, rgb });
    } else if (mark.kind === 'ruleY') {
      const py = yScale(mark.y);
      canvas.plotLine(0, py, canvas.pixelWidth - 1, py, rgb);
    } else if (mark.kind === 'ruleX') {
      const px = xScale(mark.x);
      canvas.plotLine(px, 0, px, canvas.pixelHeight - 1, rgb);
    } else if (mark.kind === 'areaY') {
      const basePy = yScale(mark.y0);
      for (const [p, pt] of mark.points.entries()) {
        const x1 = Math.round(xScale(pt.x)), y1 = yScale(pt.y);
        canvas.fillColumn(x1, y1, basePy, rgb);
        const prev = p > 0 ? mark.points[p - 1] : undefined;
        if (prev) {
          const x0 = Math.round(xScale(prev.x)), y0 = yScale(prev.y);
          const span = Math.abs(x1 - x0), step = x0 <= x1 ? 1 : -1;
          for (let s = 1; s < span; s++) canvas.fillColumn(x0 + s * step, y0 + (y1 - y0) * (s / span), basePy, rgb);
          canvas.plotLine(x0, y0, x1, y1, rgb);
        }
      }
    } else if (mark.kind === 'lineY') {
      const first = mark.points[0];
      if (mark.points.length === 1 && first) canvas.plotDot(xScale(first.x), yScale(first.y), rgb);
      for (let p = 1; p < mark.points.length; p++) {
        const prev = mark.points[p - 1];
        const curr = mark.points[p];
        if (prev && curr) canvas.plotLine(xScale(prev.x), yScale(prev.y), xScale(curr.x), yScale(curr.y), rgb);
      }
    } else {
      for (const pt of mark.points) {
        const ptRGB = mark.colorScale && pt.colorValue !== undefined
          ? mark.colorScale(pt.colorValue).rgb
          : rgb;
        canvas.plotDot(xScale(pt.x), yScale(pt.y), ptRGB);
      }
    }
  }

  if (barMarks.length > 0) {
    renderBarMarks(surface, barMarks, layout.plotX, layout.plotY, layout.plotWidth, layout.plotHeight, xScale, yScale);
  }
  canvas.flushToSurface(surface, layout.plotX, layout.plotY, false);
  return surface;
}

export function plot(options: PlotOptions): string {
  const ctx = resolveSafeCtx(options.ctx);
  const inferred = inferPlotDomains(options.marks);
  const xDomain = options.x ? options.x.domain() : inferred.xDomain;
  const yDomain = options.y ? options.y.domain() : inferred.yDomain;
  if (ctx?.mode === 'pipe') return renderPipePlot(options.marks);
  if (ctx?.mode === 'accessible') return renderAccessiblePlot(options.title, xDomain, yDomain, options.marks);
  const surface = plotSurface(options);
  if (!ctx || ctx.theme.noColor) return surfaceToPlainString(surface);
  return surfaceToString(surface, ctx.style);
}
