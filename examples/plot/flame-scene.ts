import { boxSurface, createSurface, type BijouContext, type RGB, type Surface } from '@flyingrobots/bijou';
import {
  barY,
  computeHdrHistogram,
  findFlameNode,
  flamegraphSurface,
  layoutFlamegraph,
  lineY,
  plotSurface,
  ruleX,
  scaleLinear,
  writePlotText,
  type FlameFrame,
  type FlameNode,
} from '@flyingrobots/bijou/viz';
import { createHeatScale, type VizModel } from './btop-types.js';

export const BIJOU_FLAME_TREE: FlameNode = {
  id: 'root', name: 'bijou-tui:run(app)', value: 6,
  children: [
    {
      id: 'pulse', name: 'EventBus.pulse(60Hz)', value: 8,
      children: [{
        id: 'update', name: 'app.update', value: 10,
        children: [
          { id: 'cpus', name: 'os.cpus(delta)', value: 18 },
          { id: 'force', name: 'forceSim.tick', value: 14 },
        ],
      }],
    },
    {
      id: 'render', name: 'app.view(renderDashboard)', value: 10,
      children: [
        {
          id: 'plot', name: 'plotSurface', value: 16,
          children: [
            { id: 'braille', name: 'BrailleCanvas.flush', value: 42 },
            { id: 'axes', name: 'renderGridAndAxes', value: 18 },
          ],
        },
        { id: 'half', name: 'HalfBlockCanvas.flush', value: 28 },
        { id: 'diff', name: 'surfaceToString(ANSI)', value: 24 },
      ],
    },
  ],
};

export function getActiveFlameFrames(zoomId: string): { readonly root: FlameNode; readonly frames: readonly FlameFrame[] } {
  const root = findFlameNode(BIJOU_FLAME_TREE, zoomId) ?? BIJOU_FLAME_TREE;
  return { root, frames: layoutFlamegraph(root, 6) };
}

function generateLatencySamples(phase: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < 240; i++) {
    const u = (i + 1) / 240;
    const base = 0.4 + 2.2 * (u ** 2.2) + 0.25 * Math.sin(i * 0.3 + phase);
    const tail = i > 215 ? ((i - 215) ** 1.85) * (1.8 + 0.4 * Math.cos(phase)) : 0;
    out.push(Math.max(0.15, base + tail));
  }
  return out;
}

const MUTED: RGB = [148, 163, 184];
const PRIMARY: RGB = [226, 232, 240];
const EMERALD: RGB = [52, 211, 153];

export function renderFlameSurface(model: VizModel, ctx: BijouContext): Surface {
  const cols = Math.max(76, model.cols), rows = Math.max(30, model.rows);
  const root = createSurface(cols, rows);
  const availH = rows - 1;
  const topH = Math.max(11, Math.floor(availH * 0.42)), botH = Math.max(12, availH - topH);
  const heat = createHeatScale(model.palette);

  const { root: zoomRoot, frames } = getActiveFlameFrames(model.flameZoomId);
  const selFrame = frames[Math.max(0, Math.min(frames.length - 1, model.selectedFlameIdx))] ?? frames[0];
  const selId = selFrame?.id ?? zoomRoot.id;

  const flameInner = createSurface(cols - 2, Math.max(6, topH - 2));
  const fgSurf = flamegraphSurface(zoomRoot, { width: cols - 2, height: Math.max(4, topH - 4), selectedId: selId, colorScale: heat });
  flameInner.blit(fgSurf, 0, 0);
  if (selFrame && flameInner.height >= 2) {
    const detail = `▸ Frame: ${selFrame.name} · total ${selFrame.totalPct.toFixed(1)}% · self ${selFrame.selfPct.toFixed(1)}% · zoomRoot=${zoomRoot.name} [Enter: zoom in · u: reset]`;
    writePlotText(flameInner, 1, flameInner.height - 1, detail.slice(0, cols - 4), EMERALD);
  }
  root.blit(boxSurface(flameInner, { title: `Deck 4 [SYNTHETIC DEMO] // d3-hierarchy Icicle Flamegraph (zoom: ${zoomRoot.id})`, width: cols, ctx }), 0, 0);

  const rightW = Math.min(38, Math.max(30, Math.floor(cols * 0.34))), leftW = Math.max(38, cols - rightW - 1);
  const samples = generateLatencySamples(model.elapsedSec * 1.5);
  const hdr = computeHdrHistogram(samples, 24);
  const binBars = hdr.bins.map((b) => ({ x: b.index, y: b.pct }));
  const cdfLine = hdr.bins.map((b) => ({ x: b.index, y: b.cdfPct }));
  const p99Bin = hdr.bins.findIndex((b) => b.high >= hdr.p99);

  const hdrPlot = plotSurface({
    title: 'Log-Bucket Latency Distribution (barY=% · lineY=CDF% · ruleX=P99 bin)',
    width: leftW - 2, height: Math.max(6, botH - 2), ctx, y: scaleLinear([0, 100]),
    marks: [
      barY(binBars, { label: 'bin%', stroke: '#34d399' }),
      lineY(cdfLine, { label: 'CDF%', stroke: '#38bdf8' }),
      ruleX(p99Bin >= 0 ? p99Bin : 20, { label: 'p99', stroke: '#f43f5e' }),
    ],
  });
  root.blit(boxSurface(hdrPlot, { title: 'scaleLog HDR Tail-Latency Histogram', width: leftW, ctx }), 0, topH);

  const statsInner = createSurface(Math.max(16, rightW - 2), Math.max(6, botH - 2));
  const statRows: readonly [string, string][] = [
    ['Samples', `${String(samples.length)} frames`], ['Min    ', `${hdr.min.toFixed(2)} ms`],
    ['P50    ', `${hdr.p50.toFixed(2)} ms`], ['P90    ', `${hdr.p90.toFixed(2)} ms`],
    ['P99    ', `${hdr.p99.toFixed(2)} ms`], ['P99.9  ', `${hdr.p999.toFixed(2)} ms`],
    ['Max    ', `${hdr.max.toFixed(2)} ms`],
  ];
  for (const [i, [k, v]] of statRows.entries()) {
    if (i >= statsInner.height) break;
    writePlotText(statsInner, 1, i, `${k} : `, MUTED);
    writePlotText(statsInner, 11, i, v, i >= 4 ? [244, 63, 94] : PRIMARY);
  }
  root.blit(boxSurface(statsInner, { title: 'HDR Percentiles (scaleLog)', width: rightW, ctx }), leftW + 1, topH);

  const footer = ' [Tab] view:FLAME+HDR  [↑/↓/←/→] select frame  [Enter] zoom subtree  [u] unzoom  [1-4] palette  [q] quit ';
  writePlotText(root, 1, rows - 1, footer.slice(0, cols - 2), MUTED);
  return root;
}
