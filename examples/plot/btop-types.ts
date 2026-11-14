import type { Oklch } from '@flyingrobots/bijou';
import { scaleOklch, type OklchScale } from '@flyingrobots/bijou/viz';

export type PaletteName = 'inferno' | 'viridis' | 'plasma' | 'cool';
export type ProcSortKey = 'cpu' | 'mem' | 'pid';

const PALETTE_STOPS: Record<PaletteName, readonly [Oklch, Oklch]> = {
  inferno: [{ l: 0.62, c: 0.16, h: 265 }, { l: 0.82, c: 0.19, h: 42 }],
  viridis: [{ l: 0.58, c: 0.14, h: 255 }, { l: 0.84, c: 0.17, h: 135 }],
  plasma: [{ l: 0.60, c: 0.18, h: 295 }, { l: 0.84, c: 0.18, h: 75 }],
  cool: [{ l: 0.68, c: 0.15, h: 225 }, { l: 0.78, c: 0.17, h: 325 }],
};

export function createHeatScale(palette: PaletteName): OklchScale {
  return scaleOklch([0, 100], PALETTE_STOPS[palette]);
}

export interface CoreTickSnapshot {
  readonly user: number;
  readonly sys: number;
  readonly idle: number;
  readonly total: number;
}

export interface CoreStat {
  readonly id: number;
  readonly totalPct: number;
  readonly userPct: number;
  readonly sysPct: number;
  readonly peakPct: number;
}

export interface MemBreakdown {
  readonly totalBytes: number;
  readonly usedBytes: number;
  readonly appBytes: number;
  readonly wiredBytes: number;
  readonly compressedBytes: number;
  readonly cachedBytes: number;
  readonly freeBytes: number;
}

export interface DiskStat {
  readonly totalBytes: number;
  readonly usedBytes: number;
  readonly freeBytes: number;
}

export interface ProcEntry {
  readonly pid: number;
  readonly cpuPct: number;
  readonly memPct: number;
  readonly rssKb: number;
  readonly command: string;
}

export interface TelemetryState {
  readonly cpuModel: string;
  readonly coreCount: number;
  readonly historyLen: number;
  prevCoreTicks: readonly CoreTickSnapshot[];
  cores: readonly CoreStat[];
  cpuTotalHistory: number[];
  cpuUserHistory: number[];
  cpuSysHistory: number[];
  memUsedPctHistory: number[];
  loadAvg: readonly [number, number, number];
  uptimeSec: number;
  mem: MemBreakdown;
  disk: DiskStat;
  processes: readonly ProcEntry[];
  sampleAccumSec: number;
  slowAccumSec: number;
  psInFlight: boolean;
  vmInFlight: boolean;
}

export interface VizModel {
  readonly frame: number;
  readonly elapsedSec: number;
  readonly paused: boolean;
  readonly cursorIdx: number;
  readonly selectedProcIdx: number;
  readonly sortKey: ProcSortKey;
  readonly palette: PaletteName;
  readonly sampleIntervalSec: number;
  readonly cols: number;
  readonly rows: number;
  readonly telemetry: TelemetryState;
}

const H_BLOCKS: readonly string[] = [' ', '▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'];

export function renderHorizontalBar(pct: number, widthCells: number): string {
  const clamped = Math.max(0, Math.min(100, pct));
  let rem = Math.round((clamped / 100) * widthCells * 8);
  let out = '';
  for (let i = 0; i < widthCells; i++) {
    const step = Math.max(0, Math.min(8, rem));
    out += step === 0 ? '·' : (H_BLOCKS[step] ?? '█');
    rem -= step;
  }
  return out;
}

export function formatGiB(bytes: number): string {
  const gib = bytes / (1024 * 1024 * 1024);
  return gib >= 10 ? `${gib.toFixed(1)}G` : `${gib.toFixed(2)}G`;
}

export function formatRss(rssKb: number): string {
  if (rssKb >= 1024 * 1024) return `${(rssKb / (1024 * 1024)).toFixed(1)}G`;
  if (rssKb >= 1024) return `${String(Math.round(rssKb / 1024))}M`;
  return `${String(rssKb)}K`;
}

export function formatUptime(seconds: number): string {
  const totalMin = Math.floor(seconds / 60);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  return days > 0 ? `${String(days)}d ${String(hours)}h` : `${String(hours)}h ${String(mins)}m`;
}
