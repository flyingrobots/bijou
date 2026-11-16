import { dagSlice, parseAnsiToSurface, type BijouContext, type DagNode, type Surface } from '../../packages/bijou/src/index.js';
import { flamegraphSurface, heatmapSurface, type FlameNode } from '../../packages/bijou/src/core/viz/index.js';
import { createDagPaneState, dagPane } from '../../packages/bijou-tui/src/index.js';
import { chrome, filled, panel } from './scenes-base.js';
import type { HeroPalette } from './theme.js';

// ── DAG ─────────────────────────────────────────────────────────────────────

const PIPELINE: readonly DagNode[] = [
  { id: 'src', label: 'src/', edges: ['parse', 'lint'] },
  { id: 'parse', label: 'parse', edges: ['types', 'bundle'] },
  { id: 'lint', label: 'lint', edges: ['dojo'] },
  { id: 'types', label: 'typecheck', edges: ['test'] },
  { id: 'bundle', label: 'bundle', edges: ['test', 'gif'] },
  { id: 'dojo', label: 'code-dojo', edges: ['gate'] },
  { id: 'test', label: 'vitest', edges: ['gate'] },
  { id: 'gif', label: 'record gif', edges: ['gate'] },
  { id: 'gate', label: 'ci gate', edges: ['publish'] },
  { id: 'publish', label: 'npm publish', edges: [] },
];

/** Node ids the demo walks through with `n`; each step re-slices the graph around the new focus. */
export const DAG_FOCUS_ORDER: readonly string[] = ['bundle', 'test', 'gate', 'parse'];

export function dagScene(
  width: number, height: number, focusId: string, palette: HeroPalette, ctx: BijouContext,
): Surface {
  const inner = { w: width - 2, h: height - 2 };
  const slice = dagSlice(PIPELINE, focusId, { direction: 'both', depth: 1 });
  const state = createDagPaneState({
    source: slice, width: inner.w, height: inner.h, selectedId: focusId, ctx,
    dagOptions: {
      nodeToken: palette.mutedToken, edgeToken: palette.mutedToken,
      highlightToken: palette.accent2Token, selectedToken: palette.accentToken,
    },
  });
  const body = filled(inner.w, inner.h, palette.panel);
  body.blit(parseAnsiToSurface(dagPane(state), inner.w, inner.h), 0, 0);
  const shown = slice.filter((node) => PIPELINE.some((p) => p.id === node.id)).length;
  return panel(body, ` Sugiyama DAG · BFS slice @ ${focusId} · ${String(shown)}/${String(PIPELINE.length)} nodes `, palette, ctx);
}

// ── Heatmap + flamegraph ────────────────────────────────────────────────────

export function heatScene(width: number, height: number, timeSec: number, palette: HeroPalette, ctx: BijouContext): Surface {
  const inner = { w: width - 2, h: height - 2 };
  const rows = inner.h * 2;
  const data = Array.from({ length: rows }, (_, r) => Array.from({ length: inner.w }, (_, c) => {
    const x = c / inner.w;
    const y = r / rows;
    return Math.sin(x * 9 - timeSec * 2.2 + y * 4) * Math.cos(y * 7 + timeSec * 1.3) + Math.sin((x + y) * 5 + timeSec);
  }));
  const heat = heatmapSurface({ width: inner.w, height: inner.h, data, colorScale: palette.rampScale([0, 1]) });
  return panel(heat, ' Half-block heatmap · 2 px/cell · OKLCH ramp ', palette, ctx);
}

function flameTree(timeSec: number): FlameNode {
  const w = (base: number, phase: number): number => Math.max(1, Math.round(base * (1 + 0.45 * Math.sin(timeSec * 1.8 + phase))));
  return {
    id: 'root', name: 'run(app)', value: 2, children: [
      { id: 'update', name: 'update', value: w(4, 0), children: [
        { id: 'slice', name: 'dagSlice', value: w(8, 1) },
        { id: 'pal', name: 'cpFilter', value: w(4, 2) },
      ] },
      { id: 'view', name: 'view', value: w(3, 3), children: [
        { id: 'ray', name: 'raytrace', value: w(16, 4), children: [{ id: 'half', name: 'HalfBlock', value: w(6, 5) }] },
        { id: 'heat', name: 'heatmap', value: w(7, 6) },
        { id: 'dag', name: 'dagLayout', value: w(6, 7) },
      ] },
      { id: 'diff', name: 'diff+write', value: w(5, 8) },
    ],
  };
}

const FLAME_ORDER: readonly string[] = ['ray', 'heat', 'dag', 'slice', 'diff'];

export function flameScene(width: number, height: number, timeSec: number, palette: HeroPalette, ctx: BijouContext): Surface {
  const selectedId = FLAME_ORDER.at(Math.floor(timeSec / 1.2) % FLAME_ORDER.length) ?? 'ray';
  const flame = flamegraphSurface(flameTree(timeSec), {
    width: width - 2, height: height - 2, selectedId, colorScale: palette.rampScale([0, 60]),
  });
  return panel(flame, ` Live flamegraph · ${selectedId} `, palette, ctx);
}

export function dashboardScene(
  width: number, height: number, timeSec: number, focusId: string, palette: HeroPalette, ctx: BijouContext,
): Surface {
  const surface = filled(width, height, palette.bg);
  const bodyH = height - 2;
  const leftW = Math.floor(width * 0.56);
  const rightW = width - leftW;
  const heatH = Math.floor(bodyH * 0.58);
  surface.blit(dagScene(leftW, bodyH, focusId, palette, ctx), 0, 1);
  surface.blit(heatScene(rightW, heatH, timeSec, palette, ctx), leftW, 1);
  surface.blit(flameScene(rightW, bodyH - heatH, timeSec, palette, ctx), leftW, 1 + heatH);
  chrome(surface, palette, 'pipeline explorer');
  return surface;
}
