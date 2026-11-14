import {
  BrailleCanvas, areaY, barY, boxSurface, createSurface, dot, lineY,
  plotSurface, ruleX, ruleY, scaleLinear, scaleOklch, statsPanelSurface,
  writePlotText, type BijouContext, type Surface,
} from '@flyingrobots/bijou';

export interface VizModel {
  readonly frame: number;
  readonly elapsedSec: number;
  readonly paused: boolean;
  readonly cursorIdx: number;
  readonly yMax: number;
  readonly preset: number;
  readonly cols: number;
  readonly rows: number;
}

const SAMPLES = 48;
const HEAT_SCALE = scaleOklch(
  [10, 100],
  [
    { l: 0.65, c: 0.15, h: 250 },
    { l: 0.78, c: 0.18, h: 25 },
  ],
);

export function computeSeries(phase: number, preset: number): {
  readonly p50: number[];
  readonly p99: number[];
  readonly bars: number[];
  readonly scatter: { readonly x: number; readonly y: number; readonly colorValue: number }[];
} {
  const p50: number[] = [];
  const p99: number[] = [];
  const bars: number[] = [];
  const scatter: { readonly x: number; readonly y: number; readonly colorValue: number }[] = [];
  const freq = preset === 1 ? 3 : preset === 2 ? 5 : 2;

  for (let i = 0; i < SAMPLES; i++) {
    const t = i / (SAMPLES - 1);
    const wave = Math.sin(t * Math.PI * freq + phase);
    const burst = Math.cos(t * Math.PI * (freq + 2) - phase * 1.3) ** 2;
    const v50 = Math.max(4, 24 + 14 * wave + 6 * burst);
    const v99 = Math.min(98, v50 * 1.95 + 22 * burst);
    p50.push(v50);
    p99.push(v99);
    bars.push(i % 2 === 0 ? Math.min(40, v50 * 0.85) : 0);
    scatter.push({
      x: i,
      y: 68 + 24 * Math.sin(t * Math.PI * 4 + phase) * Math.cos(t * Math.PI * 2 - phase * 0.5),
      colorValue: v99,
    });
  }
  return { p50, p99, bars, scatter };
}

function renderPhasePortrait(width: number, height: number, phase: number, preset: number, ctx: BijouContext): Surface {
  const innerW = Math.max(4, width - 2);
  const innerH = Math.max(2, height - 2);
  const inner = createSurface(innerW, innerH);
  const canvas = new BrailleCanvas(innerW, innerH);
  const cx = (canvas.pixelWidth - 1) / 2;
  const cy = (canvas.pixelHeight - 1) / 2;
  const rx = Math.max(2, cx - 2);
  const ry = Math.max(2, cy - 2);
  const a = preset + 2;
  const b = preset + 3;
  const delta = phase * 0.65;
  const steps = 160;
  let prevX = cx + rx * Math.sin(delta);
  let prevY = cy + ry * Math.sin(0);
  for (let s = 1; s <= steps; s++) {
    const t = (s / steps) * Math.PI * 2;
    const x = cx + rx * Math.sin(a * t + delta);
    const y = cy + ry * Math.sin(b * t);
    const sample = HEAT_SCALE((s / steps) * 90 + 10);
    canvas.plotLine(prevX, prevY, x, y, sample.rgb);
    prevX = x;
    prevY = y;
  }
  canvas.flushToSurface(inner, 0, 0);
  return boxSurface(inner, { title: `Lissajous Phase (${String(a)}:${String(b)} OKLCH)`, width, ctx });
}

export function renderDashboardSurface(model: VizModel, ctx: BijouContext): Surface {
  const cols = Math.max(64, model.cols);
  const rows = Math.max(22, model.rows);
  const root = createSurface(cols, rows);
  const phase = model.elapsedSec * 2.0;
  const { p50, p99, bars, scatter } = computeSeries(phase, model.preset);
  const rightW = Math.min(34, Math.max(26, Math.floor(cols * 0.34)));
  const leftW = Math.max(34, cols - rightW - 1);
  const topH = Math.max(10, Math.floor((rows - 2) / 2));
  const botH = Math.max(9, rows - topH - 2);
  const yScale = scaleLinear([0, model.yMax]);
  const cursor = Math.max(0, Math.min(SAMPLES - 1, model.cursorIdx));

  const latencySurf = plotSurface({
    title: 'Service Latency (ms) — 2x4 Braille',
    width: leftW - 2,
    height: Math.max(6, topH - 2),
    ctx,
    y: yScale,
    marks: [
      areaY(p50, { label: 'p50', stroke: '#38bdf8' }),
      lineY(p99, { label: 'p99', stroke: '#f43f5e' }),
      ruleY(80, { label: 'SLO', stroke: '#f59e0b' }),
      ruleX(cursor, { stroke: '#a78bfa' }),
    ],
  });
  root.blit(boxSurface(latencySurf, { title: 'Declarative Plot (@flyingrobots/bijou/viz)', width: leftW, ctx }), 0, 0);

  const scatterSurf = plotSurface({
    title: 'Throughput (1x8 Block) & OKLCH Scatter',
    width: leftW - 2,
    height: Math.max(6, botH - 2),
    ctx,
    y: yScale,
    marks: [
      barY(bars, { label: 'rps', stroke: '#34d399' }),
      dot(scatter, { label: 'trace', colorScale: HEAT_SCALE }),
      ruleX(cursor, { stroke: '#a78bfa' }),
    ],
  });
  root.blit(boxSurface(scatterSurf, { title: 'Sub-Cell Marks', width: leftW, ctx }), 0, topH);

  const curP50 = p50[cursor] ?? 0;
  const curP99 = p99[cursor] ?? 0;
  const stats = statsPanelSurface([
    { label: 'cursor x', value: `t=${String(cursor)}` },
    { label: 'p50 (ms)', value: curP50.toFixed(1), sparkline: p50.slice(-16) },
    { label: 'p99 (ms)', value: curP99.toFixed(1), sparkline: p99.slice(-16) },
    { label: 'y-domain', value: `[0, ${String(model.yMax)}]` },
    { label: 'stream', value: model.paused ? 'PAUSED' : 'LIVE 60Hz' },
  ], { title: 'Inspector (scale.invert)', width: rightW, ctx });
  root.blit(stats, leftW + 1, 0);
  root.blit(renderPhasePortrait(rightW, botH, phase, model.preset, ctx), leftW + 1, topH);

  const footer = ' [Space] pause  [←/→] scrub cursor  [+/-] zoom Y  [1/2/3] preset  [q] quit ';
  writePlotText(root, 1, rows - 1, footer.slice(0, cols - 2), [148, 163, 184]);
  return root;
}
