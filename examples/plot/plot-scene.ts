import {
  boxSurface,
  createSurface,
  type BijouContext,
  type Surface,
} from '@flyingrobots/bijou';
import {
  areaY,
  barY,
  dot,
  lineY,
  plotSurface,
  ruleX,
  ruleY,
  scaleLinear,
  writePlotText,
} from '@flyingrobots/bijou/viz';
import {
  renderCoreGridSurface,
  renderMemDiskSurface,
  renderProcessTableSurface,
} from './btop-panes.js';
import { createHeatScale, type TelemetrySample, type VizModel } from './btop-types.js';
import { renderFlameSurface } from './flame-scene.js';
import { renderForceSurface } from './force-scene.js';
import { renderScopeSurface } from './scope-scene.js';

export type { VizModel } from './btop-types.js';

export function renderDashboardSurface(model: VizModel, ctx: BijouContext): Surface {
  if (model.viewMode === 'scope') return renderScopeSurface(model, ctx);
  if (model.viewMode === 'force') return renderForceSurface(model, ctx);
  if (model.viewMode === 'flame') return renderFlameSurface(model, ctx);

  const cols = Math.max(76, model.cols);
  const rows = Math.max(30, model.rows);
  const root = createSurface(cols, rows);
  const t = model.telemetry;
  const heatScale = createHeatScale(model.palette);

  const topRightW = Math.min(44, Math.max(32, Math.floor(cols * 0.39)));
  const topLeftW = Math.max(38, cols - topRightW - 1);
  const availH = rows - 1;
  const topH = Math.max(12, Math.floor(availH * 0.42));
  const botH = Math.max(14, availH - topH);

  const latestIdx = Math.max(0, t.samples.length - 1);
  const inspectedIdx = model.followLive ? latestIdx : Math.max(0, Math.min(latestIdx, model.cursorSampleIdx));
  const sample = t.samples[inspectedIdx] ?? t.samples[0];
  if (!sample) return root;

  const winEnd = Math.max(t.windowSize, inspectedIdx + 1);
  const winStart = Math.max(0, winEnd - t.windowSize);
  const windowSamples: readonly TelemetrySample[] = t.samples.slice(winStart, winEnd);
  const t0 = windowSamples[0]?.timestampSec ?? 0;
  const t1 = windowSamples[windowSamples.length - 1]?.timestampSec ?? 0;
  const xScale = scaleLinear([t0, Math.max(t0 + model.sampleIntervalSec * 4, t1)]);
  const yScale = scaleLinear([0, 100]);

  const hasPin = t.pinnedPid !== null;
  const pinPct = sample.pinnedCpuPct;
  const pinLabel = pinPct !== null && Number.isFinite(pinPct) ? `${pinPct.toFixed(1)}%` : 'missing';
  const plotTitle = hasPin
    ? `★ PID ${String(t.pinnedPid)} ${t.pinnedName} (${pinLabel} · host ${sample.cpuTotalPct.toFixed(1)}% @ ${sample.timestampSec.toFixed(2)}s #${String(sample.seq)})`
    : `CPU ${sample.cpuTotalPct.toFixed(1)}% (usr ${sample.cpuUserPct.toFixed(1)}% · sys ${sample.cpuSysPct.toFixed(1)}% @ ${sample.timestampSec.toFixed(2)}s · ${String(t.samples.length)} obs)`;

  const marks = hasPin
    ? [
        areaY(windowSamples, { x: (s) => s.timestampSec, y: (s) => s.pinnedCpuPct ?? Number.NaN, label: `pid:${String(t.pinnedPid)}`, stroke: '#34d399' }),
        lineY(windowSamples, { x: (s) => s.timestampSec, y: (s) => s.cpuTotalPct, label: 'host%', stroke: '#38bdf8' }),
        ruleY(80, { label: 'warn', stroke: '#f59e0b' }),
        ruleX(sample.timestampSec, { stroke: '#a78bfa' }),
      ]
    : [
        areaY(windowSamples, { x: (s) => s.timestampSec, y: (s) => s.cpuTotalPct, label: 'tot%', stroke: '#38bdf8' }),
        lineY(windowSamples, { x: (s) => s.timestampSec, y: (s) => s.cpuUserPct, label: 'usr%', stroke: '#34d399' }),
        lineY(windowSamples, { x: (s) => s.timestampSec, y: (s) => s.cpuSysPct, label: 'sys%', stroke: '#f43f5e' }),
        ruleY(80, { label: 'warn', stroke: '#f59e0b' }),
        ruleX(sample.timestampSec, { stroke: '#a78bfa' }),
      ];

  const cpuPlot = plotSurface({
    title: plotTitle, width: topLeftW - 2, height: Math.max(6, topH - 2),
    ctx, x: xScale, y: yScale, marks,
  });
  const modeTag = model.paused ? 'PAUSED' : model.followLive ? 'LIVE' : `REPLAY #${String(sample.seq)}`;
  root.blit(boxSurface(cpuPlot, { title: `btop // @flyingrobots/bijou/viz [${modeTag}]`, width: topLeftW, ctx }), 0, 0);
  root.blit(renderCoreGridSurface(model, sample, topRightW, topH, ctx), topLeftW + 1, 0);

  const botLeftW = Math.min(52, Math.max(36, Math.floor(cols * 0.46)));
  const botRightW = Math.max(34, cols - botLeftW - 1);
  const memH = Math.min(8, Math.max(6, botH - 8));
  const specH = Math.max(6, botH - memH);

  root.blit(renderMemDiskSurface(model, sample, botLeftW, memH, ctx), 0, topH);

  const coreBars = sample.cores.map((c) => ({ x: c.id, y: c.totalPct }));
  const corePeaks = sample.cores.map((c) => ({ x: c.id, y: c.peakPct, colorValue: c.peakPct }));
  const specPlot = plotSurface({
    title: 'Per-Core Utilization (0–100%) & Observed Peak',
    width: botLeftW - 2, height: Math.max(4, specH - 2), ctx, y: yScale,
    marks: [
      dot(corePeaks, { label: 'peak%', colorScale: heatScale }),
      barY(coreBars, { label: 'core%', stroke: '#34d399' }),
    ],
  });
  root.blit(boxSurface(specPlot, { title: 'Core Spectrum (barY + peak dot)', width: botLeftW, ctx }), 0, topH + memH);
  root.blit(renderProcessTableSurface(model, sample, botRightW, botH, ctx), botLeftW + 1, topH);

  const rateMs = String(Math.round(model.sampleIntervalSec * 1000));
  const footer = ` [Tab] view  [Space] ${model.paused ? 'resume' : 'pause'}  [←/→] replay  [f] follow-live  [Enter] pin PID  [↑/↓] proc  [s] sort:${model.sortKey}  [+/-] ${rateMs}ms  [q] quit `;
  writePlotText(root, 1, rows - 1, footer.slice(0, cols - 2), [148, 163, 184]);
  return root;
}
