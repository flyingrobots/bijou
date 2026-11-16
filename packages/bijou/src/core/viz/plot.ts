import { createSurface, type Surface } from '../../ports/surface.js';
import type { BijouNodeOptions } from '../components/types.js';
import { surfaceToString } from '../render/differ.js';
import { resolveSafeCtx } from '../resolve-ctx.js';
import type { RGB } from '../theme/tokens.js';
import { computePlotLayout, renderGridAndAxes, writePlotText } from './axes.js';
import { BrailleCanvas } from './braille-canvas.js';
import { resolveMarkRGB, type BarYMark, type PlotMark, type PlotPoint } from './marks.js';
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

function isDefined(pt: PlotPoint | undefined): pt is PlotPoint {
  return pt !== undefined && Number.isFinite(pt.x) && Number.isFinite(pt.y);
}

function renderSingleBarMark(
  surface: Surface, mark: BarYMark, rgb: RGB,
  plotX: number, plotY: number, plotWidth: number, plotHeight: number,
  xScale: ContinuousScale, yScale: ContinuousScale,
): void {
  if (plotWidth <= 0 || plotHeight <= 0) return;
  const maxPy = Math.max(1, plotHeight * 4 - 1);
  const [d0, d1] = yScale.domain();
  const dMin = Math.min(d0, d1), dMax = Math.max(d0, d1);
  const pyBaseRaw = yScale(mark.y0 ?? (dMin <= 0 && 0 <= dMax ? 0 : d0));

  for (const pt of mark.points) {
    if (!isDefined(pt)) continue;
    const px = xScale(pt.x), pyValRaw = yScale(pt.y);
    if (!Number.isFinite(px) || !Number.isFinite(pyValRaw) || !Number.isFinite(pyBaseRaw)) continue;
    const cx = Math.round(px) >> 1;
    if (cx < 0 || cx >= plotWidth || Math.abs(pyValRaw - pyBaseRaw) < 0.25) continue;

    const pyTop = Math.max(0, Math.min(maxPy, Math.min(pyValRaw, pyBaseRaw)));
    const pyBot = Math.max(0, Math.min(maxPy, Math.max(pyValRaw, pyBaseRaw)));
    const rowTop = Math.max(0, Math.min(plotHeight - 1, Math.round(pyTop) >> 2));
    const rowBot = Math.max(0, Math.min(plotHeight - 1, Math.round(pyBot) >> 2));

    if (pyValRaw <= pyBaseRaw) {
      const fracInTop = Math.max(0, Math.min(1, (pyTop - rowTop * 4) / 4));
      const topStep = Math.max(1, Math.min(8, Math.round((1 - fracInTop) * 8)));
      writePlotText(surface, plotX + cx, plotY + rowTop, BLOCK_EIGHTHS[topStep] ?? '█', rgb);
      for (let r = rowTop + 1; r <= rowBot; r++) writePlotText(surface, plotX + cx, plotY + r, '█', rgb);
    } else {
      for (let r = rowTop; r < rowBot; r++) writePlotText(surface, plotX + cx, plotY + r, '█', rgb);
      const fracInBot = Math.max(0, Math.min(1, (pyBot - rowBot * 4) / 4));
      writePlotText(surface, plotX + cx, plotY + rowBot, fracInBot < 0.5 ? '▀' : '█', rgb);
    }
  }
}

export function plotSurface(options: PlotOptions): Surface {
  const width = Math.max(0, Math.floor(options.width)), height = Math.max(0, Math.floor(options.height));
  const surface = createSurface(width, height);
  if (width === 0 || height === 0) return surface;

  const ctx = resolveSafeCtx(options.ctx);
  const inferred = inferPlotDomains(options.marks);
  const xScale = options.x ? options.x.clone() : scaleLinear(inferred.xDomain);
  const yScale = options.y ? options.y.clone() : scaleLinear(inferred.yDomain).nice(4);
  const hasLegendLabels = (options.legend ?? true) && options.marks.some((m) => Boolean(m.label));
  const layout = computePlotLayout(width, height, yScale, Boolean(options.title) || hasLegendLabels, options.axes ?? true);

  const canvas = new BrailleCanvas(layout.plotWidth, layout.plotHeight);
  xScale.range([0, Math.max(0, canvas.pixelWidth - 1)]);
  yScale.range([Math.max(0, canvas.pixelHeight - 1), 0]);

  const axisRGB: RGB = ctx?.semantic('muted').fgRGB ?? [148, 163, 184];
  const gridRGB: RGB = ctx?.border('muted').fgRGB ?? [71, 85, 105];
  const titleRGB: RGB = ctx?.semantic('primary').fgRGB ?? [226, 232, 240];
  renderGridAndAxes(surface, layout, xScale, yScale, options.marks, {
    title: options.title, legend: options.legend ?? true, grid: options.grid ?? true, axisRGB, gridRGB, titleRGB,
  });

  for (const [i, mark] of options.marks.entries()) {
    const rgb = resolveMarkRGB(mark.stroke, i);
    if (mark.kind === 'barY') {
      canvas.flushToSurface(surface, layout.plotX, layout.plotY, false);
      canvas.clear();
      renderSingleBarMark(surface, mark, rgb, layout.plotX, layout.plotY, layout.plotWidth, layout.plotHeight, xScale, yScale);
    } else if (mark.kind === 'ruleY') {
      canvas.plotLine(0, yScale(mark.y), canvas.pixelWidth - 1, yScale(mark.y), rgb);
    } else if (mark.kind === 'ruleX') {
      canvas.plotLine(xScale(mark.x), 0, xScale(mark.x), canvas.pixelHeight - 1, rgb);
    } else if (mark.kind === 'areaY') {
      const basePy = yScale(mark.y0);
      for (const [p, pt] of mark.points.entries()) {
        if (!isDefined(pt)) continue;
        const x1 = Math.round(xScale(pt.x)), y1 = yScale(pt.y);
        canvas.fillColumn(x1, y1, basePy, rgb);
        const prev = p > 0 ? mark.points[p - 1] : undefined;
        if (isDefined(prev)) {
          const x0 = Math.round(xScale(prev.x)), y0 = yScale(prev.y), span = x1 - x0;
          if (span !== 0) {
            const cLo = Math.max(0, Math.min(x0, x1)), cHi = Math.min(canvas.pixelWidth - 1, Math.max(x0, x1));
            for (let x = cLo; x <= cHi; x++) canvas.fillColumn(x, y0 + (y1 - y0) * ((x - x0) / span), basePy, rgb);
          }
          canvas.plotLine(x0, y0, x1, y1, rgb);
        }
      }
    } else if (mark.kind === 'lineY') {
      for (const [p, curr] of mark.points.entries()) {
        if (!isDefined(curr)) continue;
        const prev = p > 0 ? mark.points[p - 1] : undefined;
        const next = p + 1 < mark.points.length ? mark.points[p + 1] : undefined;
        if (isDefined(prev)) canvas.plotLine(xScale(prev.x), yScale(prev.y), xScale(curr.x), yScale(curr.y), rgb);
        else if (!isDefined(next)) canvas.plotDot(xScale(curr.x), yScale(curr.y), rgb);
      }
    } else {
      for (const pt of mark.points) {
        if (!isDefined(pt)) continue;
        const ptRGB = mark.colorScale && pt.colorValue !== undefined ? mark.colorScale(pt.colorValue).rgb : rgb;
        canvas.plotDot(xScale(pt.x), yScale(pt.y), ptRGB);
      }
    }
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
  return (!ctx || ctx.theme.noColor) ? surfaceToPlainString(surface) : surfaceToString(surface, ctx.style);
}
