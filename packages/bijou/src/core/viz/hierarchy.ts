import { createSurface, type Surface } from '../../ports/surface.js';
import type { RGB } from '../theme/tokens.js';
import { writePlotText } from './axes.js';
import { scaleLog, scaleOklch } from './scales-ext.js';
import type { OklchScale } from './scales.js';

export interface HdrBin {
  readonly index: number;
  readonly low: number;
  readonly high: number;
  readonly count: number;
  readonly pct: number;
  readonly cdfPct: number;
}

export interface HdrHistogramResult {
  readonly bins: readonly HdrBin[];
  readonly p50: number;
  readonly p90: number;
  readonly p99: number;
  readonly p999: number;
  readonly min: number;
  readonly max: number;
}

function quantile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1))));
  return sorted[idx] ?? 0;
}

export function computeHdrHistogram(values: readonly number[], binCount = 24): HdrHistogramResult {
  const clean = values.filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  const nBins = Math.max(4, Math.floor(binCount));
  if (clean.length === 0) return { bins: [], p50: 0, p90: 0, p99: 0, p999: 0, min: 0, max: 0 };
  const min = clean[0] ?? 1;
  const max = clean[clean.length - 1] ?? min * 10;
  const logMap = scaleLog([min, max > min ? max : min * 10], [0, nBins]);
  const counts = new Array<number>(nBins).fill(0);
  for (const v of clean) {
    const b = Math.max(0, Math.min(nBins - 1, Math.floor(logMap(v))));
    counts[b] = (counts[b] ?? 0) + 1;
  }
  let cum = 0;
  const bins: HdrBin[] = counts.map((count, index) => {
    cum += count;
    return {
      index, low: logMap.invert(index), high: logMap.invert(index + 1),
      count, pct: (count / clean.length) * 100, cdfPct: (cum / clean.length) * 100,
    };
  });
  return {
    bins, min, max,
    p50: quantile(clean, 0.50), p90: quantile(clean, 0.90),
    p99: quantile(clean, 0.99), p999: quantile(clean, 0.999),
  };
}

export interface FlameNode {
  readonly id: string;
  readonly name: string;
  readonly value?: number;
  readonly children?: readonly FlameNode[];
}

export interface FlameFrame {
  readonly id: string;
  readonly name: string;
  readonly depth: number;
  readonly x0: number;
  readonly x1: number;
  readonly totalValue: number;
  readonly selfValue: number;
  readonly totalPct: number;
  readonly selfPct: number;
}

function sumNode(node: FlameNode): number {
  const childSum = (node.children ?? []).reduce((acc, c) => acc + sumNode(c), 0);
  return Math.max(node.value ?? 0, childSum) + (node.children && node.children.length > 0 ? (node.value ?? 0) : 0);
}

export function findFlameNode(root: FlameNode, targetId: string): FlameNode | undefined {
  if (root.id === targetId) return root;
  for (const child of root.children ?? []) {
    const found = findFlameNode(child, targetId);
    if (found) return found;
  }
  return undefined;
}

export function layoutFlamegraph(root: FlameNode, maxDepth = 8): FlameFrame[] {
  const rootTotal = Math.max(1e-9, sumNode(root));
  const frames: FlameFrame[] = [];
  function walk(node: FlameNode, depth: number, x0: number, x1: number): void {
    if (depth >= maxDepth) return;
    const totalValue = sumNode(node);
    const childSum = (node.children ?? []).reduce((a, c) => a + sumNode(c), 0);
    const selfValue = Math.max(0, totalValue - childSum);
    frames.push({
      id: node.id, name: node.name, depth, x0, x1, totalValue, selfValue,
      totalPct: (totalValue / rootTotal) * 100, selfPct: (selfValue / rootTotal) * 100,
    });
    let cursor = x0;
    const span = x1 - x0;
    for (const child of node.children ?? []) {
      const cw = totalValue > 0 ? (sumNode(child) / totalValue) * span : 0;
      if (cw > 0.005) walk(child, depth + 1, cursor, cursor + cw);
      cursor += cw;
    }
  }
  walk(root, 0, 0, 1);
  return frames;
}

export interface FlamegraphOptions {
  readonly width: number;
  readonly height: number;
  readonly selectedId?: string;
  readonly colorScale?: OklchScale;
}

export function flamegraphSurface(root: FlameNode, options: FlamegraphOptions): Surface {
  const w = Math.max(0, Math.floor(options.width)), h = Math.max(0, Math.floor(options.height));
  const surface = createSurface(w, h);
  if (w === 0 || h === 0) return surface;
  const scale = options.colorScale ?? scaleOklch([0, 60], [{ l: 0.62, c: 0.15, h: 85 }, { l: 0.66, c: 0.20, h: 25 }]);
  for (const f of layoutFlamegraph(root, h)) {
    if (f.depth >= h) continue;
    const c0 = Math.max(0, Math.min(w - 1, Math.floor(f.x0 * w)));
    const c1 = Math.max(c0 + 1, Math.min(w, Math.floor(f.x1 * w)));
    const spanW = c1 - c0;
    if (spanW <= 0) continue;
    const isSel = f.id === options.selectedId;
    const rgb: RGB = isSel ? [52, 211, 153] : scale(f.selfPct + f.totalPct * 0.35).rgb;
    const inner = `${isSel ? '▸' : ''}${f.name} ${String(Math.round(f.totalPct))}%`;
    const bar = spanW >= 3 ? `[${inner.slice(0, spanW - 2).padEnd(spanW - 2, '─')}]` : '█'.repeat(spanW);
    writePlotText(surface, c0, f.depth, bar.slice(0, spanW), rgb);
  }
  return surface;
}
