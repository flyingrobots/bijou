import { execFile, execFileSync } from 'node:child_process';
import { statfsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { CoreStat, CoreTickSnapshot, DiskStat, MemBreakdown, ProcEntry, TelemetryState } from './btop-types.js';

const HISTORY_LEN = 48;

function readCoreSnapshots(): CoreTickSnapshot[] {
  return os.cpus().map((c) => {
    const user = c.times.user + c.times.nice;
    const sys = c.times.sys + c.times.irq;
    return { user, sys, idle: c.times.idle, total: user + sys + c.times.idle };
  });
}

function readDiskStat(): DiskStat {
  try {
    const s = statfsSync('/');
    const totalBytes = s.blocks * s.bsize;
    const freeBytes = s.bavail * s.bsize;
    return { totalBytes, usedBytes: Math.max(0, totalBytes - freeBytes), freeBytes };
  } catch {
    return { totalBytes: 0, usedBytes: 0, freeBytes: 0 };
  }
}

function parseVmStat(raw: string, totalBytes: number): MemBreakdown {
  const pageMatch = /page size of (\d+) bytes/.exec(raw);
  const pageSize = pageMatch?.[1] ? Number(pageMatch[1]) : 16384;
  const getPages = (label: string): number => {
    const m = new RegExp(`${label}:\\s+(\\d+)`).exec(raw);
    return m?.[1] ? Number(m[1]) * pageSize : 0;
  };
  const appBytes = getPages('Anonymous pages');
  const wiredBytes = getPages('Pages wired down');
  const compressedBytes = getPages('Pages occupied by compressor');
  const cachedBytes = getPages('File-backed pages');
  const usedBytes = Math.min(totalBytes, appBytes + wiredBytes + compressedBytes);
  return { totalBytes, usedBytes, appBytes, wiredBytes, compressedBytes, cachedBytes, freeBytes: Math.max(0, totalBytes - usedBytes) };
}

function parsePsOutput(raw: string): ProcEntry[] {
  const out: ProcEntry[] = [];
  for (const line of raw.split('\n')) {
    const m = /^(\d+)\s+([\d.]+)\s+([\d.]+)\s+(\d+)\s+(.+)$/.exec(line.trim());
    if (!m) continue;
    const fullCmd = m[5] ?? 'unknown';
    out.push({
      pid: Number(m[1]), cpuPct: Number(m[2]), memPct: Number(m[3]),
      rssKb: Number(m[4]), command: path.basename(fullCmd.trim()) || fullCmd,
    });
    if (out.length >= 24) break;
  }
  return out;
}

export function createInitialTelemetry(): TelemetryState {
  const cpuModel = (os.cpus()[0]?.model ?? 'Host CPU').replace(/\s+/g, ' ').trim();
  const snap0 = readCoreSnapshots();
  const totalBytes = os.totalmem();
  const freeFallback = os.freemem();
  const usedFallback = totalBytes - freeFallback;
  let mem: MemBreakdown = {
    totalBytes, usedBytes: usedFallback, appBytes: usedFallback * 0.5,
    wiredBytes: usedFallback * 0.2, compressedBytes: usedFallback * 0.3, cachedBytes: freeFallback, freeBytes: freeFallback,
  };
  let processes: ProcEntry[] = [];
  try { mem = parseVmStat(execFileSync('vm_stat', [], { encoding: 'utf8', timeout: 400 }), totalBytes); } catch { /* fallback */ }
  try { processes = parsePsOutput(execFileSync('ps', ['-Ao', 'pid=,pcpu=,pmem=,rss=,comm=', '-r'], { encoding: 'utf8', timeout: 400 })); } catch { /* fallback */ }
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 35);
  const snaps = readCoreSnapshots();
  const cores: CoreStat[] = snaps.map((curr, id) => {
    const prev = snap0[id] ?? curr;
    const dTot = curr.total - prev.total;
    const u = dTot > 0 ? ((curr.user - prev.user) / dTot) * 100 : (curr.user / Math.max(1, curr.total)) * 100;
    const sy = dTot > 0 ? ((curr.sys - prev.sys) / dTot) * 100 : (curr.sys / Math.max(1, curr.total)) * 100;
    const tot = Math.max(0, Math.min(100, u + sy));
    return { id, totalPct: tot, userPct: Math.max(0, u), sysPct: Math.max(0, sy), peakPct: Math.min(98, Math.max(tot + 14, 22)) };
  });
  const avgUser = cores.reduce((a, c) => a + c.userPct, 0) / Math.max(1, cores.length);
  const avgSys = cores.reduce((a, c) => a + c.sysPct, 0) / Math.max(1, cores.length);
  const cpuTotalHistory: number[] = [];
  const cpuUserHistory: number[] = [];
  const cpuSysHistory: number[] = [];
  for (let i = 0; i < HISTORY_LEN; i++) {
    const wave = Math.sin(i * 0.26) * 8 + Math.cos(i * 0.14) * 5;
    const u = Math.max(2, Math.min(92, avgUser + wave));
    const s = Math.max(1, Math.min(90, avgSys + Math.abs(wave) * 0.45));
    cpuUserHistory.push(u);
    cpuSysHistory.push(s);
    cpuTotalHistory.push(Math.min(100, u + s));
  }
  const memPct = totalBytes > 0 ? (mem.usedBytes / totalBytes) * 100 : 50;
  const load = os.loadavg();
  return {
    cpuModel, coreCount: snaps.length, historyLen: HISTORY_LEN, prevCoreTicks: snaps, cores,
    cpuTotalHistory, cpuUserHistory, cpuSysHistory,
    memUsedPctHistory: Array.from({ length: HISTORY_LEN }, () => memPct),
    loadAvg: [load[0] ?? 0, load[1] ?? 0, load[2] ?? 0],
    uptimeSec: os.uptime(), mem, disk: readDiskStat(), processes,
    sampleAccumSec: 0, slowAccumSec: 0, psInFlight: false, vmInFlight: false,
  };
}

export function stepTelemetry(state: TelemetryState, dt: number, sampleIntervalSec: number): void {
  state.sampleAccumSec += dt;
  state.slowAccumSec += dt;
  if (state.sampleAccumSec >= sampleIntervalSec) {
    state.sampleAccumSec = 0;
    const nextSnaps = readCoreSnapshots();
    state.cores = nextSnaps.map((curr, id) => {
      const prev = state.prevCoreTicks[id] ?? curr;
      const dTot = Math.max(1, curr.total - prev.total);
      const u = Math.max(0, Math.min(100, ((curr.user - prev.user) / dTot) * 100));
      const sy = Math.max(0, Math.min(100, ((curr.sys - prev.sys) / dTot) * 100));
      const tot = Math.min(100, u + sy);
      const peakPct = Math.min(98, Math.max(tot + 12, (state.cores[id]?.peakPct ?? tot) * 0.94));
      return { id, totalPct: tot, userPct: u, sysPct: sy, peakPct };
    });
    state.prevCoreTicks = nextSnaps;
    const avgUser = state.cores.reduce((a, c) => a + c.userPct, 0) / Math.max(1, state.cores.length);
    const avgSys = state.cores.reduce((a, c) => a + c.sysPct, 0) / Math.max(1, state.cores.length);
    state.cpuUserHistory = [...state.cpuUserHistory.slice(1), avgUser];
    state.cpuSysHistory = [...state.cpuSysHistory.slice(1), avgSys];
    state.cpuTotalHistory = [...state.cpuTotalHistory.slice(1), Math.min(100, avgUser + avgSys)];
    const load = os.loadavg();
    state.loadAvg = [load[0] ?? 0, load[1] ?? 0, load[2] ?? 0];
    state.uptimeSec = os.uptime();
  }
  if (state.slowAccumSec >= 1.0) {
    state.slowAccumSec = 0;
    state.disk = readDiskStat();
    if (!state.vmInFlight) {
      state.vmInFlight = true;
      execFile('vm_stat', [], { timeout: 500 }, (err, stdout) => {
        state.vmInFlight = false;
        if (!err && stdout) state.mem = parseVmStat(stdout, state.mem.totalBytes);
      });
    }
    if (!state.psInFlight) {
      state.psInFlight = true;
      execFile('ps', ['-Ao', 'pid=,pcpu=,pmem=,rss=,comm=', '-r'], { timeout: 500 }, (err, stdout) => {
        state.psInFlight = false;
        if (!err && stdout) state.processes = parsePsOutput(stdout);
      });
    }
  }
}
