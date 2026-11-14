import { initDefaultContext } from '@flyingrobots/bijou-node';
import { boxSurface, createSurface, surfaceToString, type BijouContext, type Surface } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { isKeyMsg, isPulseMsg, isResizeMsg, quit, run, type App } from '@flyingrobots/bijou-tui';
import {
  BrailleCanvas,
  areaY,
  barY,
  dot,
  lineY,
  plotSurface,
  ruleX,
  ruleY,
  scaleLinear,
  scaleOklch,
  writePlotText,
} from '@flyingrobots/bijou/viz';

interface ShowcaseModel {
  readonly elapsedSec: number;
  readonly paused: boolean;
  readonly cursorIdx: number;
  readonly yMax: number;
  readonly cols: number;
  readonly rows: number;
}

const stdout: { columns?: number; rows?: number; isTTY?: boolean } = process.stdout;
const onceMode = process.argv.includes('--once') || !stdout.isTTY;

function renderLissajousBox(width: number, height: number, phase: number, ctx: BijouContext): Surface {
  const innerW = Math.max(8, width - 2), innerH = Math.max(4, height - 2);
  const inner = createSurface(innerW, innerH);
  const canvas = new BrailleCanvas(innerW, innerH);
  const colorScale = scaleOklch([0, 1], [
    { l: 0.64, c: 0.19, h: 255 },
    { l: 0.72, c: 0.21, h: 330 },
    { l: 0.78, c: 0.17, h: 45 },
  ]);
  const cx = (canvas.pixelWidth - 1) / 2, cy = (canvas.pixelHeight - 1) / 2;
  const rx = Math.max(2, cx - 2), ry = Math.max(2, cy - 2);
  const steps = 160;
  let prevX = cx + rx * Math.sin(phase), prevY = cy;
  for (let s = 1; s <= steps; s++) {
    const t = (s / steps) * Math.PI * 2;
    const x = cx + rx * Math.sin(3 * t + phase);
    const y = cy + ry * Math.sin(4 * t);
    canvas.plotLine(prevX, prevY, x, y, colorScale(s / steps).rgb);
    prevX = x; prevY = y;
  }
  canvas.flushToSurface(inner, 0, 0);
  return boxSurface(inner, { title: 'Lissajous Phase [SYNTHETIC] (3:4 OKLCH)', width, ctx });
}

export function renderShowcaseSurface(model: ShowcaseModel, ctx: BijouContext): Surface {
  const cols = Math.max(76, model.cols), rows = Math.max(28, model.rows);
  const root = createSurface(cols, rows);
  const availH = rows - 1;
  const topH = Math.max(12, Math.floor(availH * 0.50)), botH = Math.max(12, availH - topH);
  const rightW = Math.min(34, Math.max(26, Math.floor(cols * 0.28))), leftW = Math.max(44, cols - rightW - 1);
  const phase = model.elapsedSec * 1.6;
  const p50: number[] = [], p99: number[] = [], rpsBars: { x: number; y: number }[] = [];
  const traceDots: { x: number; y: number; colorValue: number }[] = [];
  for (let i = 0; i < 48; i++) {
    const v50 = Math.max(8, Math.min(92, 26 + 14 * Math.sin(i * 0.16 - phase) + 6 * Math.cos(i * 0.09 + phase * 0.7)));
    const v99 = Math.max(v50 + 10, Math.min(98, v50 * 1.65 + 22 * Math.sin(i * 0.34 - phase * 1.2) + 12));
    p50.push(v50); p99.push(v99);
    if (i % 2 === 0) rpsBars.push({ x: i, y: Math.max(6, Math.min(48, v50 * 0.85)) });
    traceDots.push({ x: i, y: Math.max(8, Math.min(92, 48 + 34 * Math.sin(i * 0.19 - phase * 0.9))), colorValue: i });
  }
  const cursor = Math.max(0, Math.min(47, model.cursorIdx));
  const yScale = scaleLinear([0, model.yMax]);
  const topPlot = plotSurface({
    title: 'Service Latency (ms) [SYNTHETIC DEMO] - 2x4 Braille',
    width: leftW - 2, height: Math.max(6, topH - 2), ctx, y: yScale,
    marks: [
      areaY(p50, { label: 'p50', stroke: '#38bdf8' }),
      lineY(p99, { label: 'p99', stroke: '#f43f5e' }),
      ruleY(80, { label: 'SLO', stroke: '#f59e0b' }),
      ruleX(cursor, { stroke: '#a78bfa' }),
    ],
  });
  root.blit(boxSurface(topPlot, { title: 'Declarative Plot (@flyingrobots/bijou/viz) [SYNTHETIC DEMO]', width: leftW, ctx }), 0, 0);

  const insp = createSurface(rightW - 2, Math.max(5, Math.min(8, topH - 2)));
  writePlotText(insp, 1, 0, `mode      SYNTHETIC SIM`, [245, 158, 11]);
  writePlotText(insp, 1, 1, `cursor x  t=${String(cursor)}`, [226, 232, 240]);
  writePlotText(insp, 1, 2, `p50 (ms)  ${(p50[cursor] ?? 0).toFixed(1)}`, [56, 189, 248]);
  writePlotText(insp, 1, 3, `p99 (ms)  ${(p99[cursor] ?? 0).toFixed(1)}`, [244, 63, 94]);
  writePlotText(insp, 1, 4, `y-domain  [0, ${String(model.yMax)}]`, [148, 163, 184]);
  root.blit(boxSurface(insp, { title: 'Inspector (scale.invert)', width: rightW, ctx }), leftW + 1, 0);

  const heat = scaleOklch([0, 47], [{ l: 0.65, c: 0.18, h: 250 }, { l: 0.72, c: 0.21, h: 330 }, { l: 0.80, c: 0.16, h: 55 }]);
  const botPlot = plotSurface({
    title: 'Throughput (1x8 Block) & OKLCH Scatter [SYNTHETIC]',
    width: leftW - 2, height: Math.max(6, botH - 2), ctx, y: yScale,
    marks: [
      barY(rpsBars, { label: 'rps', stroke: '#34d399' }),
      dot(traceDots, { label: 'trace', colorScale: heat }),
      ruleX(cursor, { stroke: '#a78bfa' }),
    ],
  });
  root.blit(boxSurface(botPlot, { title: 'Sub-Cell Marks [SYNTHETIC DEMO]', width: leftW, ctx }), 0, topH);
  root.blit(renderLissajousBox(rightW, botH, phase, ctx), leftW + 1, topH);
  writePlotText(root, 1, rows - 1, ' [SYNTHETIC DEMO]  [Space] pause  [←/→] scrub cursor  [+/-] zoom Y  [q] quit ', [148, 163, 184]);
  return root;
}

const initModel: ShowcaseModel = { elapsedSec: 0, paused: false, cursorIdx: 24, yMax: 100, cols: stdout.columns ?? 114, rows: stdout.rows ?? 30 };
if (onceMode) {
  const ctx = createTestContext({ mode: 'interactive' });
  console.log(surfaceToString(renderShowcaseSurface(initModel, ctx), ctx.style));
} else {
  const ctx = initDefaultContext();
  const app: App<ShowcaseModel> = {
    init: () => [initModel, []],
    update: (msg, m) => {
      if (isKeyMsg(msg)) {
        if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) return [m, [quit()]];
        if (msg.key === ' ' || msg.key === 'space') return [{ ...m, paused: !m.paused }, []];
        if (msg.key === 'left' || msg.key === 'h') return [{ ...m, cursorIdx: Math.max(0, m.cursorIdx - 1) }, []];
        if (msg.key === 'right' || msg.key === 'l') return [{ ...m, cursorIdx: Math.min(47, m.cursorIdx + 1) }, []];
        if (msg.key === '+' || msg.key === '=') return [{ ...m, yMax: Math.max(40, m.yMax - 20) }, []];
        if (msg.key === '-' || msg.key === '_') return [{ ...m, yMax: Math.min(200, m.yMax + 20) }, []];
      }
      if (isResizeMsg(msg)) return [{ ...m, cols: msg.columns, rows: msg.rows }, []];
      if (isPulseMsg(msg) && !m.paused) return [{ ...m, elapsedSec: m.elapsedSec + msg.dt }, []];
      return [m, []];
    },
    view: (m) => renderShowcaseSurface(m, ctx),
  };
  await run(app);
}
