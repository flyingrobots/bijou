import { execFile, execFileSync } from 'node:child_process';
import { statfsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { CoreStat, CoreTickSnapshot, DiskStat, MemBreakdown, ProcEntry, TelemetryCollector, TelemetrySample } from './btop-types.js';

const MAX_SAMPLES = 240;
const WINDOW_SIZE = 48;

function readCoreSnapshots(): CoreTickSnapshot[] {
  return os.cpus().map((c) => {
    const user = c.times.user + c.times.nice, sys = c.times.sys + c.times.irq;
    return { user, sys, idle: c.times.idle, total: user + sys + c.times.idle };
  });
}

function readDiskStat(): DiskStat {
  try {
    const s = statfsSync('/'), totalBytes = s.blocks * s.bsize, freeBytes = s.bavail * s.bsize;
    return { available: true, totalBytes, usedBytes: Math.max(0, totalBytes - freeBytes), freeBytes };
  } catch { return { available: false, totalBytes: 0, usedBytes: 0, freeBytes: 0 }; }
}

function fallbackMem(): MemBreakdown {
  const totalBytes = os.totalmem(), freeBytes = os.freemem();
  return { totalBytes, usedBytes: Math.max(0, totalBytes - freeBytes), freeBytes, vmStatAvailable: false, appBytes: null, wiredBytes: null, compressedBytes: null, cachedBytes: null };
}

function parseVmStat(raw: string, totalBytes: number): MemBreakdown {
  const pageMatch = /page size of (\d+) bytes/.exec(raw);
  if (!pageMatch) return fallbackMem();
  const pageSize = Number(pageMatch[1]);
  const getPages = (label: string): number => {
    const m = new RegExp(`${label}:\\s+(\\d+)`).exec(raw);
    return m?.[1] ? Number(m[1]) * pageSize : 0;
  };
  const appBytes = getPages('Anonymous pages'), wiredBytes = getPages('Pages wired down');
  const compressedBytes = getPages('Pages occupied by compressor'), cachedBytes = getPages('File-backed pages');
  const usedBytes = Math.min(totalBytes, appBytes + wiredBytes + compressedBytes);
  return {
    totalBytes, usedBytes, freeBytes: Math.max(0, totalBytes - usedBytes),
    vmStatAvailable: true, appBytes, wiredBytes, compressedBytes, cachedBytes,
  };
}

function parsePsOutput(raw: string): ProcEntry[] {
  const out: ProcEntry[] = [];
  for (const line of raw.split('\n')) {
    const m = /^(\d+)\s+([\d.]+)\s+([\d.]+)\s+(\d+)\s+(.+)$/.exec(line.trim());
    if (!m) continue;
    const fullCmd = m[5] ?? 'unknown';
    out.push({ pid: Number(m[1]), cpuPct: Number(m[2]), memPct: Number(m[3]), rssKb: Number(m[4]), command: path.basename(fullCmd.trim()) || fullCmd });
    if (out.length >= 24) break;
  }
  return out;
}

export function togglePinnedPid(collector: TelemetryCollector, proc: ProcEntry | undefined): void {
  if (!proc || collector.pinnedPid === proc.pid) {
    collector.pinnedPid = null; collector.pinnedName = ''; return;
  }
  collector.pinnedPid = proc.pid; collector.pinnedName = proc.command;
}

function buildSample(
  seq: number, timestampSec: number, cores: readonly CoreStat[],
  mem: MemBreakdown, disk: DiskStat, processes: readonly ProcEntry[], pinnedPid: number | null,
): TelemetrySample {
  const n = Math.max(1, cores.length);
  const cpuUserPct = cores.reduce((a, c) => a + c.userPct, 0) / n, cpuSysPct = cores.reduce((a, c) => a + c.sysPct, 0) / n;
  const cpuTotalPct = Math.min(100, cpuUserPct + cpuSysPct);
  const pinnedProc = pinnedPid !== null ? processes.find((p) => p.pid === pinnedPid) : undefined;
  const pinnedCpuPct = pinnedPid !== null ? (pinnedProc ? Math.min(100, pinnedProc.cpuPct) : Number.NaN) : null;
  const load = os.loadavg();
  return {
    seq, timestampSec, cpuTotalPct, cpuUserPct, cpuSysPct, pinnedCpuPct, cores: [...cores],
    loadAvg: [load[0] ?? 0, load[1] ?? 0, load[2] ?? 0], uptimeSec: os.uptime(), mem: { ...mem }, disk: { ...disk }, processes: [...processes],
  };
}

export function createInitialTelemetry(): TelemetryCollector {
  const cpuModel = (os.cpus()[0]?.model ?? 'Host CPU').replace(/\s+/g, ' ').trim();
  const snap0 = readCoreSnapshots();
  let latestMem = fallbackMem();
  let latestProcesses: ProcEntry[] = [];
  try { latestMem = parseVmStat(execFileSync('vm_stat', [], { encoding: 'utf8', timeout: 400 }), latestMem.totalBytes); } catch { /* unavailable */ }
  try { latestProcesses = parsePsOutput(execFileSync('ps', ['-Ao', 'pid=,pcpu=,pmem=,rss=,comm=', '-r'], { encoding: 'utf8', timeout: 400 })); } catch { /* empty */ }
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 35);
  const snaps = readCoreSnapshots();
  const cores: CoreStat[] = snaps.map((curr, id) => {
    const prev = snap0[id] ?? curr, dTot = curr.total - prev.total;
    const u = dTot > 0 ? Math.max(0, Math.min(100, ((curr.user - prev.user) / dTot) * 100)) : 0;
    const sy = dTot > 0 ? Math.max(0, Math.min(100, ((curr.sys - prev.sys) / dTot) * 100)) : 0;
    const tot = Math.min(100, u + sy);
    return { id, totalPct: tot, userPct: u, sysPct: sy, peakPct: tot };
  });
  const latestDisk = readDiskStat();
  const initialSample = buildSample(0, 0, cores, latestMem, latestDisk, latestProcesses, null);
  return {
    cpuModel, coreCount: snaps.length, maxSamples: MAX_SAMPLES, windowSize: WINDOW_SIZE,
    prevCoreTicks: snaps, corePeaks: cores.map((c) => c.peakPct),
    latestMem, latestDisk, latestProcesses, pinnedPid: null, pinnedName: '',
    samples: [initialSample], sampleAccumSec: 0, slowAccumSec: 0, psInFlight: false, vmInFlight: false,
  };
}

export function stepTelemetry(collector: TelemetryCollector, elapsedSec: number, dt: number, sampleIntervalSec: number): boolean {
  collector.sampleAccumSec += dt;
  collector.slowAccumSec += dt;
  let added = false;
  if (collector.sampleAccumSec >= sampleIntervalSec) {
    collector.sampleAccumSec = 0;
    const nextSnaps = readCoreSnapshots();
    const cores: CoreStat[] = nextSnaps.map((curr, id) => {
      const prev = collector.prevCoreTicks[id] ?? curr, dTot = Math.max(1, curr.total - prev.total);
      const u = Math.max(0, Math.min(100, ((curr.user - prev.user) / dTot) * 100));
      const sy = Math.max(0, Math.min(100, ((curr.sys - prev.sys) / dTot) * 100));
      const tot = Math.min(100, u + sy);
      const peakPct = Math.max(collector.corePeaks[id] ?? 0, tot);
      collector.corePeaks[id] = peakPct;
      return { id, totalPct: tot, userPct: u, sysPct: sy, peakPct };
    });
    collector.prevCoreTicks = nextSnaps;
    const nextSeq = (collector.samples[collector.samples.length - 1]?.seq ?? 0) + 1;
    const sample = buildSample(nextSeq, elapsedSec, cores, collector.latestMem, collector.latestDisk, collector.latestProcesses, collector.pinnedPid);
    collector.samples = [...collector.samples.slice(-(collector.maxSamples - 1)), sample];
    added = true;
  }
  if (collector.slowAccumSec >= 1.0) {
    collector.slowAccumSec = 0;
    collector.latestDisk = readDiskStat();
    if (!collector.vmInFlight) {
      collector.vmInFlight = true;
      execFile('vm_stat', [], { timeout: 500 }, (err, stdout) => {
        collector.vmInFlight = false;
        if (!err && stdout) collector.latestMem = parseVmStat(stdout, collector.latestMem.totalBytes);
      });
    }
    if (!collector.psInFlight) {
      collector.psInFlight = true;
      execFile('ps', ['-Ao', 'pid=,pcpu=,pmem=,rss=,comm=', '-r'], { timeout: 500 }, (err, stdout) => {
        collector.psInFlight = false;
        if (!err && stdout) collector.latestProcesses = parsePsOutput(stdout);
      });
    }
  }
  return added;
}
