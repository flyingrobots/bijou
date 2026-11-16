import { createSurface, type Surface } from '../../ports/surface.js';
import type { RGB } from '../theme/tokens.js';
import { writePlotText } from './axes.js';
import { BrailleCanvas } from './braille-canvas.js';

export interface ForceNodeInput {
  readonly id: string; readonly label?: string; readonly group?: number;
  readonly x?: number; readonly y?: number; readonly pinned?: boolean;
}
export interface ForceNode {
  readonly id: string; readonly label: string; readonly group: number;
  x: number; y: number; vx: number; vy: number; pinned: boolean;
}
export interface ForceLink {
  readonly source: string; readonly target: string; readonly weight?: number; readonly active?: boolean;
}
export interface ForceSimulationOptions {
  readonly repulsion?: number; readonly springLength?: number; readonly springStrength?: number;
  readonly gravity?: number; readonly damping?: number;
}
export interface ForceSimulation {
  nodes(): readonly ForceNode[];
  links(): readonly ForceLink[];
  alpha(): number;
  reheat(nextAlpha?: number): void;
  nudgeNode(id: string, dx: number, dy: number, pin?: boolean): void;
  tick(iterations?: number): void;
}

export function forceSimulation(
  initialNodes: readonly ForceNodeInput[],
  initialLinks: readonly ForceLink[],
  options: ForceSimulationOptions = {},
): ForceSimulation {
  const repulsion = options.repulsion ?? 0.0022, springLength = options.springLength ?? 0.24;
  const springStrength = options.springStrength ?? 0.14, gravity = options.gravity ?? 0.04;
  const damping = options.damping ?? 0.80;
  let currentAlpha = 1.0;

  const nodes: ForceNode[] = initialNodes.map((n, i) => {
    const angle = (i / Math.max(1, initialNodes.length)) * Math.PI * 2;
    return {
      id: n.id, label: n.label ?? n.id, group: n.group ?? 0,
      x: n.x ?? 0.5 + 0.32 * Math.cos(angle), y: n.y ?? 0.5 + 0.32 * Math.sin(angle),
      vx: 0, vy: 0, pinned: n.pinned ?? false,
    };
  });
  const links: ForceLink[] = [...initialLinks];
  const byId = new Map<string, ForceNode>(nodes.map((n) => [n.id, n]));

  function stepOnce(): void {
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      if (!a) continue;
      if (!a.pinned) {
        a.vx += (0.5 - a.x) * gravity * currentAlpha;
        a.vy += (0.5 - a.y) * gravity * currentAlpha;
      }
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        if (!b) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy + 0.0015;
        const d = Math.sqrt(d2), f = (repulsion * currentAlpha) / d2;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        if (!a.pinned) { a.vx -= fx; a.vy -= fy; }
        if (!b.pinned) { b.vx += fx; b.vy += fy; }
      }
    }
    for (const link of links) {
      const s = byId.get(link.source), t = byId.get(link.target);
      if (!s || !t) continue;
      const dx = t.x - s.x, dy = t.y - s.y, dist = Math.max(0.001, Math.hypot(dx, dy));
      const delta = (dist - springLength) * springStrength * (link.weight ?? 1) * currentAlpha * 0.5;
      const fx = (dx / dist) * delta, fy = (dy / dist) * delta;
      if (!s.pinned) { s.vx += fx; s.vy += fy; }
      if (!t.pinned) { t.vx -= fx; t.vy -= fy; }
    }
    for (const n of nodes) {
      if (n.pinned) continue;
      n.vx *= damping; n.vy *= damping;
      n.x = Math.max(0.08, Math.min(0.92, n.x + n.vx));
      n.y = Math.max(0.10, Math.min(0.90, n.y + n.vy));
    }
    currentAlpha = Math.max(0.05, currentAlpha * 0.985);
  }
  return {
    nodes: () => nodes, links: () => links, alpha: () => currentAlpha,
    reheat(nextAlpha = 0.9): void { currentAlpha = Math.max(0.05, Math.min(1, nextAlpha)); },
    nudgeNode(id: string, dx: number, dy: number, pin?: boolean): void {
      const node = byId.get(id);
      if (!node) return;
      node.x = Math.max(0.06, Math.min(0.94, node.x + dx));
      node.y = Math.max(0.08, Math.min(0.92, node.y + dy));
      node.vx = 0; node.vy = 0;
      if (pin !== undefined) node.pinned = pin;
      currentAlpha = Math.max(currentAlpha, 0.45);
    },
    tick(iterations = 1): void {
      for (let i = 0, c = Math.max(1, Math.floor(iterations)); i < c; i++) stepOnce();
    },
  };
}
export interface ForceGraphRenderOptions {
  readonly width: number;
  readonly height: number;
  readonly selectedNodeId?: string;
}
const GROUP_PALETTE: readonly RGB[] = [
  [56, 189, 248], [52, 211, 153], [244, 63, 94], [245, 158, 11], [167, 139, 250],
];

export function forceGraphSurface(sim: ForceSimulation, options: ForceGraphRenderOptions): Surface {
  const w = Math.max(0, Math.floor(options.width)), h = Math.max(0, Math.floor(options.height));
  const surface = createSurface(w, h);
  if (w === 0 || h === 0) return surface;
  const canvas = new BrailleCanvas(w, h), nodes = sim.nodes();
  const byId = new Map<string, ForceNode>(nodes.map((n) => [n.id, n]));
  for (const link of sim.links()) {
    const s = byId.get(link.source), t = byId.get(link.target);
    if (!s || !t) continue;
    const isSel = link.source === options.selectedNodeId || link.target === options.selectedNodeId;
    const rgb: RGB = link.active ? [245, 158, 11] : isSel ? [56, 189, 248] : [100, 116, 139];
    canvas.plotLine(s.x * (canvas.pixelWidth - 1), s.y * (canvas.pixelHeight - 1), t.x * (canvas.pixelWidth - 1), t.y * (canvas.pixelHeight - 1), rgb);
  }
  canvas.flushToSurface(surface, 0, 0, false);
  for (const node of nodes) {
    const isSel = node.id === options.selectedNodeId;
    const tag = isSel ? `◆[${node.label}]` : node.pinned ? `*${node.label}` : `[${node.label}]`;
    const cx = Math.max(0, Math.min(Math.max(0, w - tag.length), Math.round(node.x * (w - 1) - tag.length / 2)));
    const cy = Math.max(0, Math.min(h - 1, Math.round(node.y * (h - 1))));
    const rgb: RGB = isSel ? [250, 204, 21] : (GROUP_PALETTE[Math.abs(node.group) % GROUP_PALETTE.length] ?? [226, 232, 240]);
    writePlotText(surface, cx, cy, tag.slice(0, w), rgb);
  }
  return surface;
}
