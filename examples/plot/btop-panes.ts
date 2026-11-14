import { boxSurface, createSurface, type BijouContext, type RGB, type Surface } from '@flyingrobots/bijou';
import { writePlotText } from '@flyingrobots/bijou/viz';
import {
  createHeatScale,
  formatGiB,
  formatRss,
  formatUptime,
  renderHorizontalBar,
  type ProcEntry,
  type VizModel,
} from './btop-types.js';

const MUTED: RGB = [148, 163, 184];
const PRIMARY: RGB = [226, 232, 240];
const ACCENT: RGB = [56, 189, 248];
const EMERALD: RGB = [52, 211, 153];

export function renderCoreGridSurface(model: VizModel, width: number, height: number, ctx: BijouContext): Surface {
  const innerW = Math.max(16, width - 2);
  const innerH = Math.max(4, height - 2);
  const inner = createSurface(innerW, innerH);
  const heat = createHeatScale(model.palette);
  const t = model.telemetry;

  const [l1, l5, l15] = t.loadAvg;
  const hdr = `${t.cpuModel} · load ${l1.toFixed(2)} ${l5.toFixed(2)} ${l15.toFixed(2)} · up ${formatUptime(t.uptimeSec)}`;
  writePlotText(inner, 1, 0, hdr.slice(0, innerW - 2), ACCENT);

  const availRows = Math.max(1, innerH - 1);
  const cols = Math.max(1, Math.min(3, Math.ceil(t.cores.length / availRows)));
  const colW = Math.floor((innerW - 1) / cols);
  const barW = Math.max(2, colW - 10);

  for (const [idx, core] of t.cores.entries()) {
    const col = idx % cols;
    const row = 1 + Math.floor(idx / cols);
    if (row >= innerH) break;
    const x0 = 1 + col * colW;
    const label = `C${String(core.id).padStart(2, '0')}`;
    const bar = renderHorizontalBar(core.totalPct, barW);
    const pctStr = `${String(Math.round(core.totalPct)).padStart(3, ' ')}%`;
    const color = heat(Math.max(15, core.totalPct)).rgb;
    writePlotText(inner, x0, row, label, MUTED);
    writePlotText(inner, x0 + 4, row, bar, color);
    writePlotText(inner, x0 + 4 + barW + 1, row, pctStr, PRIMARY);
  }
  return boxSurface(inner, { title: `CPU Cores (${String(t.coreCount)}x · ${model.palette})`, width, ctx });
}

export function renderMemDiskSurface(model: VizModel, width: number, height: number, ctx: BijouContext): Surface {
  const innerW = Math.max(18, width - 2);
  const innerH = Math.max(4, height - 2);
  const inner = createSurface(innerW, innerH);
  const heat = createHeatScale(model.palette);
  const m = model.telemetry.mem;
  const d = model.telemetry.disk;
  const tot = Math.max(1, m.totalBytes);
  const dTot = Math.max(1, d.totalBytes);

  const rows: { readonly label: string; readonly bytes: number; readonly pct: number; readonly sub: string }[] = [
    { label: 'Used RAM', bytes: m.usedBytes, pct: (m.usedBytes / tot) * 100, sub: `/${formatGiB(tot)}` },
    { label: 'App Anon', bytes: m.appBytes, pct: (m.appBytes / tot) * 100, sub: '' },
    { label: 'Wired   ', bytes: m.wiredBytes, pct: (m.wiredBytes / tot) * 100, sub: '' },
    { label: 'Compress', bytes: m.compressedBytes, pct: (m.compressedBytes / tot) * 100, sub: '' },
    { label: 'FS Cache', bytes: m.cachedBytes, pct: (m.cachedBytes / tot) * 100, sub: '' },
    { label: 'Disk (/)', bytes: d.usedBytes, pct: (d.usedBytes / dTot) * 100, sub: `/${formatGiB(dTot)}` },
  ];

  const barW = Math.max(6, innerW - 26);
  for (const [r, item] of rows.entries()) {
    if (r >= innerH) break;
    const valStr = `${formatGiB(item.bytes)}${item.sub}`.padEnd(11, ' ').slice(0, 11);
    const pctStr = `${String(Math.round(item.pct)).padStart(3, ' ')}%`;
    const bar = renderHorizontalBar(item.pct, barW);
    const rgb = heat(Math.max(18, item.pct)).rgb;
    writePlotText(inner, 1, r, item.label, MUTED);
    writePlotText(inner, 10, r, bar, rgb);
    writePlotText(inner, 11 + barW, r, `${pctStr} ${valStr}`.slice(0, innerW - 11 - barW), PRIMARY);
  }
  return boxSurface(inner, { title: 'Memory (Mach VM) & Disk (/)', width, ctx });
}

export function sortProcesses(procs: readonly ProcEntry[], key: VizModel['sortKey']): ProcEntry[] {
  return [...procs].sort((a, b) => {
    if (key === 'mem') return b.rssKb - a.rssKb || b.cpuPct - a.cpuPct;
    if (key === 'pid') return a.pid - b.pid;
    return b.cpuPct - a.cpuPct || b.rssKb - a.rssKb;
  });
}

export function renderProcessTableSurface(model: VizModel, width: number, height: number, ctx: BijouContext): Surface {
  const innerW = Math.max(24, width - 2);
  const innerH = Math.max(4, height - 2);
  const inner = createSurface(innerW, innerH);
  const heat = createHeatScale(model.palette);
  const sorted = sortProcesses(model.telemetry.processes, model.sortKey);
  const selIdx = Math.max(0, Math.min(Math.max(0, sorted.length - 1), model.selectedProcIdx));
  const cmdW = Math.max(8, innerW - 31);

  const cpuHdr = model.sortKey === 'cpu' ? 'CPU▼' : 'CPU%';
  const memHdr = model.sortKey === 'mem' ? 'MEM▼' : 'MEM%';
  const pidHdr = model.sortKey === 'pid' ? 'PID▼  ' : 'PID   ';
  const hdr = `  ${pidHdr}${'PROGRAM'.padEnd(cmdW, ' ')} ${cpuHdr.padStart(5, ' ')} ${memHdr.padStart(5, ' ')} ${'RSS'.padStart(6, ' ')} LOAD`;
  writePlotText(inner, 0, 0, hdr.slice(0, innerW), ACCENT);

  const maxRows = Math.max(1, innerH - 2);
  for (let i = 0; i < maxRows; i++) {
    const proc = sorted[i];
    if (!proc) break;
    const isSel = i === selIdx;
    const isPinned = proc.pid === model.telemetry.pinnedPid;
    const prefix = isPinned ? '★' : isSel ? '▸' : ' ';
    const pidStr = String(proc.pid).padStart(5, ' ');
    const cmdStr = proc.command.slice(0, cmdW).padEnd(cmdW, ' ');
    const cpuStr = proc.cpuPct.toFixed(1).padStart(5, ' ');
    const memStr = proc.memPct.toFixed(1).padStart(5, ' ');
    const rssStr = formatRss(proc.rssKb).padStart(6, ' ');
    const bar = renderHorizontalBar(Math.min(100, proc.cpuPct), 4);
    const rowColor = isPinned ? ACCENT : isSel ? EMERALD : PRIMARY;
    writePlotText(inner, 0, i + 1, `${prefix} ${pidStr} ${cmdStr}`, rowColor);
    writePlotText(inner, 9 + cmdW, i + 1, cpuStr, heat(Math.min(100, Math.max(15, proc.cpuPct))).rgb);
    writePlotText(inner, 15 + cmdW, i + 1, `${memStr} ${rssStr} `, rowColor);
    writePlotText(inner, 28 + cmdW, i + 1, bar, heat(Math.min(100, Math.max(20, proc.cpuPct))).rgb);
  }
  const sel = sorted[selIdx];
  if (sel && innerH >= 3) {
    const pinHint = model.telemetry.pinnedPid === sel.pid ? '[PINNED · Enter unpin]' : '[Enter to pin PID]';
    const info = `▸ PID ${String(sel.pid)} ${sel.command} · CPU ${sel.cpuPct.toFixed(1)}% · ${formatRss(sel.rssKb)} ${pinHint}`;
    writePlotText(inner, 1, innerH - 1, info.slice(0, innerW - 2), EMERALD);
  }
  return boxSurface(inner, { title: `Processes [sort: ${model.sortKey}] (${String(sorted.length)})`, width, ctx });
}
