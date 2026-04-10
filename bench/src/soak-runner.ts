/**
 * Soak runner — headed live dashboard with keyboard quit.
 *
 * Cycles through all bench scenarios in a loop, showing a live
 * updating table of per-scenario metrics. Press q, Esc, or Ctrl+C
 * to quit cleanly between scenarios.
 *
 * Usage:
 *   npm run soak                       # default log + live display
 *   npm run soak -- --cycles=50        # stop after N cycles
 *   npm run soak -- --out=custom.jsonl # custom log path
 */

import { appendFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { SCENARIOS } from './scenarios/index.js';
import { computeStats, formatNs } from './stats.js';

// --- CLI args ---
const argv = process.argv.slice(2);
function argStr(name: string, fallback: string): string {
  const match = argv.find((a) => a.startsWith(`--${name}=`));
  return match ? match.split('=')[1]! : fallback;
}
function argInt(name: string, fallback: number): number {
  const match = argv.find((a) => a.startsWith(`--${name}=`));
  return match ? parseInt(match.split('=')[1]!, 10) : fallback;
}

const LOG_PATH = resolve(argStr('out', 'bench/soak.jsonl'));
const MAX_CYCLES = argInt('cycles', Infinity);

const scenarios = SCENARIOS.filter((s) => s.id !== 'soak');

// --- Quit detection ---
let quit = false;

if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', (data: Buffer) => {
    const ch = data[0]!;
    // q, Q, Esc, Ctrl+C
    if (ch === 0x71 || ch === 0x51 || ch === 0x1b || ch === 0x03) {
      quit = true;
    }
  });
}

process.on('SIGINT', () => { quit = true; });

// --- ANSI helpers ---
const CSI = '\x1b[';
const CLEAR = CSI + '2J' + CSI + 'H';
const HIDE_CURSOR = CSI + '?25l';
const SHOW_CURSOR = CSI + '?25h';
const BOLD = CSI + '1m';
const DIM = CSI + '2m';
const RESET = CSI + '0m';
const GREEN = CSI + '32m';
const YELLOW = CSI + '33m';
const CYAN = CSI + '36m';

function moveTo(row: number, col: number): string {
  return `${CSI}${row};${col}H`;
}

// --- Log file ---
if (!existsSync(LOG_PATH)) {
  writeFileSync(LOG_PATH, '');
}

// --- State per scenario ---
interface ScenarioRow {
  id: string;
  p50: string;
  p90: string;
  cov: string;
  heap: string;
  lastCycle: number;
  status: 'pending' | 'running' | 'done';
}

const rows: ScenarioRow[] = scenarios.map((s) => ({
  id: s.id,
  p50: '—',
  p90: '—',
  cov: '—',
  heap: '—',
  lastCycle: -1,
  status: 'pending' as const,
}));

// --- Render dashboard ---
function render(cycle: number, elapsed: string): void {
  let out = CLEAR;
  out += moveTo(1, 1);
  out += `${BOLD}${CYAN} soak ${RESET}${DIM} cycle ${cycle} | elapsed ${elapsed}s | q/esc to quit${RESET}\n\n`;

  // Table header
  out += `  ${DIM}${'Scenario'.padEnd(24)} ${'P50'.padStart(12)} ${'P90'.padStart(12)} ${'CoV'.padStart(8)} ${'Heap'.padStart(10)}${RESET}\n`;
  out += `  ${DIM}${'─'.repeat(24)} ${'─'.repeat(12)} ${'─'.repeat(12)} ${'─'.repeat(8)} ${'─'.repeat(10)}${RESET}\n`;

  for (const row of rows) {
    const indicator = row.status === 'running'
      ? `${YELLOW}▸${RESET} `
      : row.status === 'done'
        ? `${GREEN}✓${RESET} `
        : '  ';
    out += `${indicator}${row.id.padEnd(24)} ${row.p50.padStart(12)} ${row.p90.padStart(12)} ${row.cov.padStart(8)} ${row.heap.padStart(10)}\n`;
  }

  out += `\n  ${DIM}log: ${LOG_PATH}${RESET}\n`;

  process.stdout.write(out);
}

// --- Main loop ---
async function main(): Promise<void> {
  process.stdout.write(HIDE_CURSOR);
  const startWall = performance.now();
  let cycle = 0;

  try {
    while (!quit && cycle < MAX_CYCLES) {
      // Reset row status for this cycle
      for (const row of rows) row.status = 'pending';

      for (let si = 0; si < scenarios.length; si++) {
        if (quit) break;

        const scenario = scenarios[si]!;
        const row = rows[si]!;
        row.status = 'running';

        const elapsed = ((performance.now() - startWall) / 1000).toFixed(0);
        render(cycle, elapsed);

        // Yield to let stdin events process before the blocking frame loop
        await new Promise((r) => setTimeout(r, 0));
        if (quit) break;

        const warmup = scenario.defaultWarmupFrames;
        const frames = scenario.defaultMeasureFrames;

        // Setup + warmup
        const state = scenario.setup();
        for (let i = 0; i < warmup; i++) {
          scenario.frame(state, i);
        }

        // Timed measurement
        const frameTimes: number[] = new Array(frames);
        for (let i = 0; i < frames; i++) {
          const t0 = performance.now();
          scenario.frame(state, warmup + i);
          const t1 = performance.now();
          frameTimes[i] = (t1 - t0) * 1_000_000;
        }
        scenario.teardown?.(state);

        // Stats + memory
        const stats = computeStats(frameTimes);
        const mem = process.memoryUsage();

        // Update row
        row.p50 = formatNs(stats.p50);
        row.p90 = formatNs(stats.p90);
        row.cov = `${(stats.cov * 100).toFixed(1)}%`;
        row.heap = `${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`;
        row.lastCycle = cycle;
        row.status = 'done';

        // Log
        const entry = {
          ts: new Date().toISOString(),
          cycle,
          scenario: scenario.id,
          frames,
          nsPerFrame: Math.round(stats.mean),
          p50: Math.round(stats.p50),
          p90: Math.round(stats.p90),
          p99: Math.round(stats.p99),
          min: Math.round(stats.min),
          max: Math.round(stats.max),
          covPct: Math.round(stats.cov * 1000) / 10,
          heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024 * 10) / 10,
          heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024 * 10) / 10,
          rssMB: Math.round(mem.rss / 1024 / 1024 * 10) / 10,
          externalMB: Math.round(mem.external / 1024 / 1024 * 10) / 10,
        };
        appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');

        // Render updated dashboard
        const elapsedNow = ((performance.now() - startWall) / 1000).toFixed(0);
        render(cycle, elapsedNow);
      }

      cycle++;
    }
  } finally {
    // Clean exit: show cursor, move below the dashboard
    const finalElapsed = ((performance.now() - startWall) / 1000).toFixed(1);
    render(cycle, finalElapsed);
    process.stdout.write(`\n  ${BOLD}soak: ${cycle} cycles, ${finalElapsed}s${RESET}\n\n`);
    process.stdout.write(SHOW_CURSOR);

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  }
}

main().catch((err) => {
  process.stdout.write(SHOW_CURSOR);
  console.error(err);
  process.exit(1);
});
