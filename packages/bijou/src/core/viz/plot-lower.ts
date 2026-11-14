import type { Surface } from '../../ports/surface.js';
import { formatTickValue } from './axes.js';
import type { PlotMark } from './marks.js';

export interface InferredDomains {
  readonly xDomain: readonly [number, number];
  readonly yDomain: readonly [number, number];
}

export function inferPlotDomains(marks: readonly PlotMark[]): InferredDomains {
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;

  for (const mark of marks) {
    if (mark.kind === 'ruleY') {
      if (mark.y < yMin) yMin = mark.y;
      if (mark.y > yMax) yMax = mark.y;
      continue;
    }
    if (mark.kind === 'ruleX') {
      if (mark.x < xMin) xMin = mark.x;
      if (mark.x > xMax) xMax = mark.x;
      continue;
    }
    if (mark.kind === 'areaY') {
      if (mark.y0 < yMin) yMin = mark.y0;
      if (mark.y0 > yMax) yMax = mark.y0;
    }
    if (mark.kind === 'barY') {
      if (0 < yMin) yMin = 0;
      if (0 > yMax) yMax = 0;
    }
    for (const pt of mark.points) {
      if (pt.x < xMin) xMin = pt.x;
      if (pt.x > xMax) xMax = pt.x;
      if (pt.y < yMin) yMin = pt.y;
      if (pt.y > yMax) yMax = pt.y;
    }
  }

  if (!Number.isFinite(xMin) || !Number.isFinite(xMax)) {
    xMin = 0;
    xMax = 1;
  } else if (xMin === xMax) {
    xMin -= 1;
    xMax += 1;
  }

  if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) {
    yMin = 0;
    yMax = 1;
  } else if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }

  return { xDomain: [xMin, xMax], yDomain: [yMin, yMax] };
}

export function renderPipePlot(marks: readonly PlotMark[]): string {
  const rows: string[] = ['series\tcount\tx_min\tx_max\ty_min\ty_max\ty_last'];
  let idx = 0;
  for (const mark of marks) {
    if (mark.kind === 'ruleY' || mark.kind === 'ruleX') continue;
    idx++;
    const name = mark.label ?? `${mark.kind}_${String(idx)}`;
    const pts = mark.points;
    const lastPt = pts[pts.length - 1];
    if (!lastPt) {
      rows.push(`${name}\t0\t0\t0\t0\t0\t0`);
      continue;
    }
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of pts) {
      if (p.x < x0) x0 = p.x;
      if (p.x > x1) x1 = p.x;
      if (p.y < y0) y0 = p.y;
      if (p.y > y1) y1 = p.y;
    }
    rows.push(`${name}\t${String(pts.length)}\t${formatTickValue(x0)}\t${formatTickValue(x1)}\t${formatTickValue(y0)}\t${formatTickValue(y1)}\t${formatTickValue(lastPt.y)}`);
  }
  return rows.join('\n');
}

export function renderAccessiblePlot(
  title: string | undefined,
  xDomain: readonly [number, number],
  yDomain: readonly [number, number],
  marks: readonly PlotMark[],
): string {
  const parts: string[] = [
    `Plot: ${title ?? 'Untitled'}.`,
    `X domain [${formatTickValue(xDomain[0])}, ${formatTickValue(xDomain[1])}], Y domain [${formatTickValue(yDomain[0])}, ${formatTickValue(yDomain[1])}].`,
  ];
  let idx = 0;
  for (const mark of marks) {
    if (mark.kind === 'ruleY') {
      parts.push(`Horizontal rule${mark.label ? ` (${mark.label})` : ''} at y=${formatTickValue(mark.y)}.`);
      continue;
    }
    if (mark.kind === 'ruleX') {
      parts.push(`Vertical rule${mark.label ? ` (${mark.label})` : ''} at x=${formatTickValue(mark.x)}.`);
      continue;
    }
    idx++;
    const name = mark.label ?? `Series ${String(idx)} (${mark.kind})`;
    const pts = mark.points;
    const lastPt = pts[pts.length - 1];
    if (!lastPt) {
      parts.push(`${name}: 0 points.`);
      continue;
    }
    let y0 = Infinity, y1 = -Infinity;
    for (const p of pts) {
      if (p.y < y0) y0 = p.y;
      if (p.y > y1) y1 = p.y;
    }
    parts.push(`${name}: ${String(pts.length)} points, min=${formatTickValue(y0)}, max=${formatTickValue(y1)}, latest=${formatTickValue(lastPt.y)}.`);
  }
  return parts.join(' ');
}

export function surfaceToPlainString(surface: Surface): string {
  const lines: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let row = '';
    for (let x = 0; x < surface.width; x++) row += surface.get(x, y).char || ' ';
    lines.push(row);
  }
  return lines.join('\n');
}
