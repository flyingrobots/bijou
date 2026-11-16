import type { BijouContext, Surface } from '../../packages/bijou/src/index.js';
import {
  areaY,
  barY,
  dot,
  lineY,
  plotSurface,
  ruleY,
  scaleLinear,
} from '../../packages/bijou/src/core/viz/index.js';
import { chrome, filled, panel } from './scenes.js';
import type { HeroPalette } from './theme.js';

const SAMPLES = 90;

/** Throughput and p99 latency for the last 90 ticks, scrolling with time. */
function series(timeSec: number): { t: number; rps: number; p99: number }[] {
  return Array.from({ length: SAMPLES }, (_, i) => {
    const t = timeSec * 6 + i;
    const rps = 520 + 180 * Math.sin(t * 0.11) + 70 * Math.sin(t * 0.37) + 25 * Math.cos(t * 1.3);
    const p99 = 38 + 14 * Math.sin(t * 0.09 + 1.2) + 9 * Math.max(0, Math.sin(t * 0.31)) ** 3 * 4;
    return { t: i, rps, p99 };
  });
}

/** A latency histogram whose tail breathes over time. */
function histogram(timeSec: number): { bucket: number; count: number }[] {
  return Array.from({ length: 16 }, (_, i) => {
    const centre = 5 + Math.sin(timeSec * 0.9) * 1.5;
    return { bucket: i, count: Math.round(90 * Math.exp(-((i - centre) ** 2) / 8) + 6 * Math.max(0, i - 11)) };
  });
}

/** Deploy scatter: duration against change size, coloured by error rate. */
function scatter(timeSec: number): { size: number; secs: number; err: number }[] {
  return Array.from({ length: 48 }, (_, i) => {
    const size = (i * 37) % 100;
    const secs = 20 + size * 0.6 + 12 * Math.sin(i * 1.7 + timeSec * 0.8);
    return { size, secs, err: (Math.sin(i * 2.3) + 1) / 2 };
  });
}

/** The declarative plot grammar: marks over scales, lowered to Braille cells. */
export function plotScene(width: number, height: number, timeSec: number, palette: HeroPalette, ctx: BijouContext): Surface {
  const surface = filled(width, height, palette.bg);
  const bodyH = height - 2;
  const leftW = Math.floor(width * 0.58);
  const rightW = width - leftW;
  const data = series(timeSec);

  const traffic = plotSurface({
    width: leftW - 2, height: bodyH - 2, grid: true, legend: true, ctx,
    y: scaleLinear([0, 900]),
    marks: [
      areaY(data, { x: (d) => d.t, y: (d) => d.rps, label: 'req/s', stroke: palette.accent2 }),
      lineY(data, { x: (d) => d.t, y: (d) => d.p99 * 10, label: 'p99 ×10 ms', stroke: palette.accent }),
      ruleY(700, { label: 'SLO', stroke: palette.muted }),
    ],
  });
  surface.blit(panel(traffic, ' plot() · areaY + lineY + ruleY ', palette, ctx), 0, 1);

  const topH = Math.floor(bodyH / 2);
  const hist = plotSurface({
    width: rightW - 2, height: topH - 2, ctx,
    marks: [barY(histogram(timeSec), { x: (d) => d.bucket, y: (d) => d.count, label: 'latency', stroke: palette.accent })],
  });
  surface.blit(panel(hist, ' barY · latency histogram ', palette, ctx), leftW, 1);

  const deploys = plotSurface({
    width: rightW - 2, height: bodyH - topH - 2, ctx,
    marks: [dot(scatter(timeSec), {
      x: (d) => d.size, y: (d) => d.secs, colorValue: (d) => d.err, colorScale: palette.rampScale([0, 1]), label: 'deploys',
    })],
  });
  surface.blit(panel(deploys, ' dot · scaleOklch colour ', palette, ctx), leftW, 1 + topH);

  chrome(surface, palette, 'plot grammar');
  return surface;
}
