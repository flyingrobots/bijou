import { boxSurface, createSurface, type BijouContext, type RGB, type Surface } from '@flyingrobots/bijou';
import {
  barY,
  dot,
  forceGraphSurface,
  forceSimulation,
  plotSurface,
  scaleLinear,
  writePlotText,
  type ForceSimulation,
} from '@flyingrobots/bijou/viz';
import { createHeatScale, renderHorizontalBar, type VizModel } from './btop-types.js';

export function createWorkspaceForceSim(): ForceSimulation {
  const sim = forceSimulation(
    [
      { id: 'bijou', label: 'bijou-core', group: 0, x: 0.45, y: 0.42 },
      { id: 'viz', label: 'bijou/viz', group: 1, x: 0.30, y: 0.25 },
      { id: 'tui', label: 'bijou-tui', group: 0, x: 0.62, y: 0.28 },
      { id: 'node', label: 'bijou-node', group: 0, x: 0.76, y: 0.48 },
      { id: 'mcp', label: 'bijou-mcp', group: 4, x: 0.68, y: 0.72 },
      { id: 'graft', label: 'graft-ast', group: 1, x: 0.24, y: 0.56 },
      { id: 'locks', label: 'git-locks', group: 2, x: 0.46, y: 0.76 },
      { id: 'task', label: 'taskalisk', group: 3, x: 0.20, y: 0.78 },
      { id: 'reader', label: 'reader-vault', group: 4, x: 0.82, y: 0.24 },
      { id: 'tts', label: 'ai-tts', group: 3, x: 0.84, y: 0.74 },
    ],
    [
      { source: 'viz', target: 'bijou', weight: 1.6 },
      { source: 'tui', target: 'bijou', weight: 1.5 },
      { source: 'node', target: 'bijou', weight: 1.3 },
      { source: 'node', target: 'tui', weight: 1.2 },
      { source: 'mcp', target: 'bijou', weight: 1.2 },
      { source: 'graft', target: 'bijou', weight: 1.1, active: true },
      { source: 'graft', target: 'viz', weight: 1.2 },
      { source: 'locks', target: 'graft', weight: 1.4, active: true },
      { source: 'locks', target: 'task', weight: 1.5, active: true },
      { source: 'locks', target: 'tui', weight: 1.0 },
      { source: 'reader', target: 'tts', weight: 1.3 },
      { source: 'reader', target: 'mcp', weight: 1.1 },
    ],
  );
  sim.tick(18);
  return sim;
}

const MUTED: RGB = [148, 163, 184];
const PRIMARY: RGB = [226, 232, 240];
const ACCENT: RGB = [56, 189, 248];
const EMERALD: RGB = [52, 211, 153];

export function renderForceSurface(model: VizModel, ctx: BijouContext): Surface {
  const cols = Math.max(76, model.cols), rows = Math.max(30, model.rows);
  const root = createSurface(cols, rows);
  const availH = rows - 1;
  const rightW = Math.min(44, Math.max(34, Math.floor(cols * 0.38)));
  const leftW = Math.max(38, cols - rightW - 1);
  const sim = model.forceSim;
  const nodes = sim.nodes();
  const selNode = nodes[Math.max(0, Math.min(nodes.length - 1, model.selectedNodeIdx))] ?? nodes[0];
  const selId = selNode?.id ?? 'bijou';

  const graphInner = forceGraphSurface(sim, {
    width: Math.max(12, leftW - 2),
    height: Math.max(8, availH - 2),
    selectedNodeId: selId,
  });
  root.blit(
    boxSurface(graphInner, {
      title: `Deck 3 // d3-force in Braille (alpha=${sim.alpha().toFixed(3)} · ${String(nodes.length)} nodes)`,
      width: leftW,
      ctx,
    }),
    0,
    0,
  );

  const infoH = Math.min(11, Math.max(9, Math.floor(availH * 0.42)));
  const chartH = Math.max(8, availH - infoH);
  const infoInner = createSurface(Math.max(16, rightW - 2), Math.max(6, infoH - 2));
  const links = sim.links();
  const connected = links.filter((l) => l.source === selId || l.target === selId);

  writePlotText(infoInner, 1, 0, `Selected: ◆[${selNode?.label ?? selId}]`, EMERALD);
  writePlotText(infoInner, 1, 1, `Coords  : x=${(selNode?.x ?? 0).toFixed(3)} y=${(selNode?.y ?? 0).toFixed(3)} ${selNode?.pinned ? '[PINNED]' : '[FREE]'}`, PRIMARY);
  writePlotText(infoInner, 1, 2, `Alpha   : ${renderHorizontalBar(sim.alpha() * 100, 12)} ${(sim.alpha() * 100).toFixed(0)}%`, ACCENT);
  writePlotText(infoInner, 1, 3, `Degree  : ${String(connected.length)} incident springs`, MUTED);
  for (let i = 0; i < Math.min(4, connected.length); i++) {
    const c = connected[i];
    if (!c) continue;
    if (4 + i >= infoInner.height) break;
    const peer = c.source === selId ? c.target : c.source;
    const tag = c.active ? 'LOCK-ACTIVE' : `w=${(c.weight ?? 1).toFixed(1)}`;
    writePlotText(infoInner, 2, 4 + i, `↔ ${peer.padEnd(10, ' ')} (${tag})`, c.active ? [245, 158, 11] : PRIMARY);
  }
  root.blit(boxSurface(infoInner, { title: 'Force Node & Contention Inspector', width: rightW, ctx }), leftW + 1, 0);

  const degBars = nodes.map((n, idx) => {
    const deg = links.filter((l) => l.source === n.id || l.target === n.id).length;
    return { x: idx, y: deg * 18 };
  });
  const speedDots = nodes.map((n, idx) => {
    const v = Math.min(96, 65 + Math.hypot(n.vx, n.vy) * 900);
    return { x: idx, y: v, colorValue: v };
  });
  const degPlot = plotSurface({
    title: 'Node Degree (barY) & Kinetic Energy (dot)',
    width: rightW - 2,
    height: Math.max(4, chartH - 2),
    ctx,
    y: scaleLinear([0, 100]),
    marks: [
      barY(degBars, { label: 'deg', stroke: '#38bdf8' }),
      dot(speedDots, { label: 'ke', colorScale: createHeatScale(model.palette) }),
    ],
  });
  root.blit(boxSurface(degPlot, { title: 'Topology Metrics', width: rightW, ctx }), leftW + 1, infoH);

  const footer = ' [Tab] view:FORCE  [↑/↓] select node  [←/→] nudge  [Enter] pin/reheat  [1-4] palette  [q] quit ';
  writePlotText(root, 1, rows - 1, footer.slice(0, cols - 2), MUTED);
  return root;
}
