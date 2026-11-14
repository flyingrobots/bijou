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
import { createHeatScale, type VizModel } from './btop-types.js';

export type { VizModel } from './btop-types.js';

export function renderDashboardSurface(model: VizModel, ctx: BijouContext): Surface {
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

  const cursor = Math.max(0, Math.min(t.historyLen - 1, model.cursorIdx));
  const curTot = t.cpuTotalHistory[cursor] ?? 0;
  const curUsr = t.cpuUserHistory[cursor] ?? 0;
  const curSys = t.cpuSysHistory[cursor] ?? 0;
  const yScale = scaleLinear([0, 100]);

  const cpuPlot = plotSurface({
    title: `CPU ${curTot.toFixed(1)}% (usr ${curUsr.toFixed(1)}% · sys ${curSys.toFixed(1)}% @ t=${String(cursor)})`,
    width: topLeftW - 2,
    height: Math.max(6, topH - 2),
    ctx,
    y: yScale,
    marks: [
      areaY(t.cpuTotalHistory, { label: 'tot%', stroke: '#38bdf8' }),
      lineY(t.cpuUserHistory, { label: 'usr%', stroke: '#34d399' }),
      lineY(t.cpuSysHistory, { label: 'sys%', stroke: '#f43f5e' }),
      ruleY(80, { label: 'warn', stroke: '#f59e0b' }),
      ruleX(cursor, { stroke: '#a78bfa' }),
    ],
  });
  const streamTag = model.paused ? 'FROZEN' : 'LIVE';
  root.blit(
    boxSurface(cpuPlot, {
      title: `btop // @flyingrobots/bijou/viz [${streamTag}]`,
      width: topLeftW,
      ctx,
    }),
    0,
    0,
  );
  root.blit(renderCoreGridSurface(model, topRightW, topH, ctx), topLeftW + 1, 0);

  const botLeftW = Math.min(52, Math.max(36, Math.floor(cols * 0.46)));
  const botRightW = Math.max(34, cols - botLeftW - 1);
  const memH = Math.min(8, Math.max(6, botH - 8));
  const specH = Math.max(6, botH - memH);

  root.blit(renderMemDiskSurface(model, botLeftW, memH, ctx), 0, topH);

  const coreBars = t.cores.map((c) => ({ x: c.id, y: Math.min(72, Math.max(4, c.totalPct * 0.72)) }));
  const corePeaks = t.cores.map((c) => ({
    x: c.id,
    y: Math.max(78, Math.min(98, 76 + c.peakPct * 0.22)),
    colorValue: c.peakPct,
  }));
  const specPlot = plotSurface({
    title: 'Per-Core 1x8 Load & Peak Envelope',
    width: botLeftW - 2,
    height: Math.max(4, specH - 2),
    ctx,
    y: yScale,
    marks: [
      barY(coreBars, { label: 'core%', stroke: '#34d399' }),
      dot(corePeaks, { label: 'peak', colorScale: heatScale }),
    ],
  });
  root.blit(
    boxSurface(specPlot, { title: 'Core Spectrum (barY + OKLCH dot)', width: botLeftW, ctx }),
    0,
    topH + memH,
  );

  root.blit(renderProcessTableSurface(model, botRightW, botH, ctx), botLeftW + 1, topH);

  const rateMs = String(Math.round(model.sampleIntervalSec * 1000));
  const footer = ` [Space] ${model.paused ? 'resume' : 'freeze'}  [↑/↓] proc  [s] sort:${model.sortKey}  [←/→] scrub  [1-4] ${model.palette}  [+/-] ${rateMs}ms  [q] quit `;
  writePlotText(root, 1, rows - 1, footer.slice(0, cols - 2), [148, 163, 184]);
  return root;
}
