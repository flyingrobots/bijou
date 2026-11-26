// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The dashboard that Shatter breaks: real Bijou Components (boxSurface, tableSurface, progressBar, sparkline, tabs)
// laid out in solid panels, every cell of which is matter.
import {
  boxSurface, createSurface, parseAnsiToSurface, progressBar, sparkline, stringToSurface, tableSurface, tabs,
  type BijouContext, type Surface, type TokenValue,
} from '@flyingrobots/bijou';

export interface Rect { readonly x: number; readonly y: number; readonly w: number; readonly h: number }
export interface Layout { readonly header: Rect; readonly flow: Rect; readonly deploy: Rect; readonly services: Rect }

export const PANE_BG = '#0b0c12';
const FILL: TokenValue = { hex: '#a9b1d6', bg: '#1a1b26' };
const EDGE: TokenValue = { hex: '#7aa2f7', bg: '#1a1b26' };
const TITLE_EDGE: TokenValue = { hex: '#bb9af7', bg: '#1f2335' };
const TITLE_FILL: TokenValue = { hex: '#c0caf5', bg: '#1f2335' };
const MAX_WIDTH = 100;

/** Where the panels sit in a pane: a centred block about half the pane tall, so its debris heaps below. */
export function layout(width: number, height: number): Layout {
  const w = Math.max(24, Math.min(MAX_WIDTH, width - 2));
  const x = Math.max(0, Math.floor((width - w) / 2));
  const total = Math.max(11, Math.min(30, Math.round((height - 2) * 0.55)));
  const midH = Math.max(4, Math.floor((total - 3) * 0.45));
  const botH = Math.max(4, total - 3 - midH);
  const leftW = Math.floor((w - 1) / 2);
  return {
    header: { x, y: 1, w, h: 3 },
    flow: { x, y: 4, w: leftW, h: midH },
    deploy: { x: x + leftW + 1, y: 4, w: w - leftW - 1, h: midH },
    services: { x, y: 4 + midH, w, h: botH },
  };
}

/** Every matter cell of the layout, row by row. */
export function matterCells(rects: Layout, width: number, height: number): readonly (readonly [number, number])[] {
  const cells: (readonly [number, number])[] = [];
  for (const r of [rects.header, rects.flow, rects.deploy, rects.services]) {
    for (let y = r.y; y < Math.min(height, r.y + r.h); y += 1) for (let x = r.x; x < Math.min(width, r.x + r.w); x += 1) cells.push([x, y]);
  }
  return cells;
}

/** A smooth signal in [0, 1] for metric `k` at `t` seconds; the seed shifts each metric's phase. */
export function signal(seed: number, k: number, t: number): number {
  const phase = ((seed >>> ((k % 8) * 3)) & 63) / 10;
  const v = 0.5 + 0.3 * Math.sin(t * (0.7 + k * 0.23) + phase) + 0.2 * Math.sin(t * (1.9 + k * 0.31) + k * 1.7);
  return Math.max(0, Math.min(1, v));
}

const METRICS: readonly (readonly [string, number, string])[] = [
  ['req/s', 1800, ''], ['p99', 240, 'ms'], ['errors', 40, ''], ['cpu', 100, '%'], ['mem', 64, 'GB'], ['queue', 900, ''],
];
const PIPELINES = ['build', 'test', 'canary', 'ship', 'docs', 'e2e', 'bench', 'audit'] as const;
const SERVICES = ['gateway', 'auth', 'billing', 'search', 'render', 'mailer', 'ledger', 'cache', 'queue', 'cdn'] as const;

function put(content: Surface, line: string, x: number, y: number): void {
  if (line.length > 0) content.blit(stringToSurface(line, line.length, 1), x, y);
}

function panel(r: Rect, title: string, content: Surface, ctx: BijouContext, top = false): Surface {
  return boxSurface(content, {
    width: r.w, title, ctx, borderToken: top ? TITLE_EDGE : EDGE, bgToken: top ? TITLE_FILL : FILL,
  });
}

function flowContent(iw: number, ih: number, seed: number, t: number): Surface {
  const content = createSurface(iw, ih);
  const t0 = Math.floor(t * 10) / 10;
  const span = Math.max(4, iw - 16);
  for (let k = 0; k < ih; k += 1) {
    const [label, scale, unit] = METRICS[k % METRICS.length] ?? ['?', 1, ''];
    const now = signal(seed, k, t);
    put(content, `${label.padEnd(6)} ${`${String(Math.round(now * scale))}${unit}`.padStart(7)}`, 1, k);
    const series = Array.from({ length: span }, (_, s) => signal(seed, k, t0 - (span - 1 - s) * 0.15));
    put(content, sparkline(series, { min: 0, max: 1 }), 15, k);
  }
  return content;
}

function deployContent(iw: number, ih: number, seed: number, t: number, ctx: BijouContext): Surface {
  const content = createSurface(iw, ih);
  const width = Math.max(4, iw - 15);
  for (let k = 0; k < ih; k += 1) {
    const rate = 0.08 + ((seed >>> k) & 7) * 0.015;
    const pct = Math.min(100, ((t * rate + k * 0.37) % 1.25) * 100);
    put(content, (PIPELINES[k % PIPELINES.length] ?? '').padEnd(7), 1, k);
    content.blit(parseAnsiToSurface(progressBar(pct, { width, ctx }), iw - 8, 1), 8, k);
  }
  return content;
}

function servicesContent(iw: number, ih: number, seed: number, t: number, ctx: BijouContext): Surface {
  const content = createSurface(iw, ih);
  const rows = SERVICES.slice(0, Math.max(1, ih - 2)).map((name, k) => {
    const load = signal(seed, k + 3, t * 0.8);
    return [name, load > 0.82 ? 'degraded' : 'healthy', `${String(Math.round(40 + load * 300))} ms`, String(Math.round(load * 4200))];
  });
  const columns = [{ header: 'service' }, { header: 'status' }, { header: 'p99', align: 'right' as const }, { header: 'rps', align: 'right' as const }];
  content.blit(tableSurface({ columns, rows, width: iw - 2, variant: 'plain', ctx }), 1, 0);
  return content;
}

function headerContent(iw: number, t: number, ctx: BijouContext): Surface {
  const content = createSurface(iw, 1);
  const cs = Math.floor(t * 100);
  const clock = `${String(Math.floor(cs / 6000)).padStart(2, '0')}:${String(Math.floor(cs / 100) % 60).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`;
  const label = `◆ BIJOU OPS  uptime ${clock}  `;
  put(content, label, 1, 0);
  const bar = tabs([{ label: 'Overview' }, { label: 'Deploys', badge: '3' }, { label: 'Alerts' }], { active: Math.floor(t / 2) % 3, ctx });
  content.blit(parseAnsiToSurface(bar, Math.max(0, iw - label.length - 1), 1), label.length + 1, 0);
  return content;
}

/** The whole pane: the dashboard at `t` seconds of its own clock on the pane background. */
export function dashboard(width: number, height: number, seed: number, t: number, ctx: BijouContext): Surface {
  const surface = createSurface(width, height);
  surface.fill({ char: ' ', bg: PANE_BG });
  const rects = layout(width, height);
  const inner = (r: Rect): readonly [number, number] => [Math.max(1, r.w - 2), Math.max(1, r.h - 2)];
  const [fw, fh] = inner(rects.flow);
  const [dw, dh] = inner(rects.deploy);
  const [sw, sh] = inner(rects.services);
  surface.blit(panel(rects.header, 'shatter', headerContent(inner(rects.header)[0], t, ctx), ctx, true), rects.header.x, rects.header.y);
  surface.blit(panel(rects.flow, 'Throughput', flowContent(fw, fh, seed, t), ctx), rects.flow.x, rects.flow.y);
  surface.blit(panel(rects.deploy, 'Pipelines', deployContent(dw, dh, seed, t, ctx), ctx), rects.deploy.x, rects.deploy.y);
  surface.blit(panel(rects.services, 'Services', servicesContent(sw, sh, seed, t, ctx), ctx), rects.services.x, rects.services.y);
  return surface;
}
