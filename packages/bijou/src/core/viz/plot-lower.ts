import type { Surface } from '../../ports/surface.js';
import { formatTickValue } from './axes.js';
import type { PlotMark, PlotPoint } from './marks.js';

export interface InferredDomains {
  readonly xDomain: readonly [number, number];
  readonly yDomain: readonly [number, number];
}

function isDefinedPoint(p: PlotPoint): boolean {
  return Number.isFinite(p.x) && Number.isFinite(p.y);
}

function sanitizeTsvField(raw: string): string {
  return raw.replace(/\t/g, '\\t').replace(/\r/g, '\\r').replace(/\n/g, '\\n');
}

function serializeTsvNumber(n: number): string {
  if (!Number.isFinite(n)) return 'NaN';
  return Object.is(n, -0) ? '0' : String(n);
}

export function inferPlotDomains(marks: readonly PlotMark[]): InferredDomains {
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  const includeX = (v: number): void => { if (Number.isFinite(v)) { if (v < xMin) xMin = v; if (v > xMax) xMax = v; } };
  const includeY = (v: number): void => { if (Number.isFinite(v)) { if (v < yMin) yMin = v; if (v > yMax) yMax = v; } };

  for (const mark of marks) {
    if (mark.kind === 'ruleY') { includeY(mark.y); continue; }
    if (mark.kind === 'ruleX') { includeX(mark.x); continue; }
    if (mark.kind === 'areaY') includeY(mark.y0);
    if (mark.kind === 'barY') includeY(mark.y0 ?? 0);
    for (const pt of mark.points) {
      if (isDefinedPoint(pt)) { includeX(pt.x); includeY(pt.y); }
    }
  }
  if (!Number.isFinite(xMin) || !Number.isFinite(xMax)) { xMin = 0; xMax = 1; }
  else if (xMin === xMax) { xMin -= 1; xMax += 1; }
  if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) { yMin = 0; yMax = 1; }
  else if (yMin === yMax) { yMin -= 1; yMax += 1; }
  return { xDomain: [xMin, xMax], yDomain: [yMin, yMax] };
}

export function renderPipePlot(marks: readonly PlotMark[]): string {
  const rows: string[] = ['series\tcount\tx_min\tx_max\ty_min\ty_max\ty_last'];
  let idx = 0;
  for (const mark of marks) {
    if (mark.kind === 'ruleY' || mark.kind === 'ruleX') continue;
    idx++;
    const name = sanitizeTsvField(mark.label ?? `${mark.kind}_${String(idx)}`);
    const valid = mark.points.filter(isDefinedPoint);
    const lastPt = valid[valid.length - 1];
    if (!lastPt) {
      rows.push(`${name}\t0\tNaN\tNaN\tNaN\tNaN\tNaN`);
      continue;
    }
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of valid) {
      if (p.x < x0) x0 = p.x;
      if (p.x > x1) x1 = p.x;
      if (p.y < y0) y0 = p.y;
      if (p.y > y1) y1 = p.y;
    }
    rows.push(
      `${name}\t${String(valid.length)}\t${serializeTsvNumber(x0)}\t${serializeTsvNumber(x1)}\t${serializeTsvNumber(y0)}\t${serializeTsvNumber(y1)}\t${serializeTsvNumber(lastPt.y)}`,
    );
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
    const valid = mark.points.filter(isDefinedPoint);
    const missing = mark.points.length - valid.length;
    const lastPt = valid[valid.length - 1];
    if (!lastPt) {
      parts.push(`${name}: 0 valid points${missing > 0 ? ` (${String(missing)} missing)` : ''}.`);
      continue;
    }
    let y0 = Infinity, y1 = -Infinity;
    for (const p of valid) {
      if (p.y < y0) y0 = p.y;
      if (p.y > y1) y1 = p.y;
    }
    const gapNote = missing > 0 ? ` (${String(missing)} missing)` : '';
    parts.push(`${name}: ${String(valid.length)} points${gapNote}, min=${formatTickValue(y0)}, max=${formatTickValue(y1)}, latest=${formatTickValue(lastPt.y)}.`);
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
