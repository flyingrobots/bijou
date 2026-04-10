/**
 * Soak runner — long-running loop through all bench scenarios.
 *
 * Cycles through every registered scenario repeatedly, collecting
 * frame-time and memory metrics per cycle and appending them as
 * JSONL to a log file. Runs until interrupted (Ctrl+C).
 *
 * Usage:
 *   npm run soak                       # default log location
 *   npm run soak -- --out=my-soak.jsonl # custom log path
 *   npm run soak -- --cycles=50        # stop after N cycles
 *
 * The log file is append-only JSONL. Each line is one scenario run:
 *   {"ts":"...","cycle":0,"scenario":"paint-ascii","frames":200,
 *    "nsPerFrame":234000,"p50Ns":230000,...,"heapUsedMB":12.3,...}
 *
 * Tail it live:    tail -f bench/soak.jsonl | jq .
 * Quick summary:   cat bench/soak.jsonl | jq -r '[.cycle,.scenario,.p50] | @tsv'
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

// Scenarios to include. Skip the 'soak' scenario itself — it's a
// 1000-frame stability test that would slow down each cycle. The soak
// runner IS the stability test; each scenario runs with its own
// default frame count.
const scenarios = SCENARIOS.filter((s) => s.id !== 'soak');

// --- Setup ---
let running = true;
process.on('SIGINT', () => {
  running = false;
  process.stderr.write('\nsoak: interrupted, finishing current scenario...\n');
});

if (!existsSync(LOG_PATH)) {
  writeFileSync(LOG_PATH, '');
}

process.stderr.write(`soak: ${scenarios.length} scenarios, logging to ${LOG_PATH}\n`);
process.stderr.write('soak: Ctrl+C to stop\n\n');

// --- Main loop ---
let cycle = 0;

while (running && cycle < MAX_CYCLES) {
  const cycleStart = performance.now();

  for (const scenario of scenarios) {
    if (!running) break;

    const warmup = scenario.defaultWarmupFrames;
    const frames = scenario.defaultMeasureFrames;

    // Setup
    const state = scenario.setup();

    // Warmup (untimed)
    for (let i = 0; i < warmup; i++) {
      scenario.frame(state, i);
    }

    // Timed measurement with per-frame recording
    const frameTimes: number[] = new Array(frames);
    for (let i = 0; i < frames; i++) {
      const t0 = performance.now();
      scenario.frame(state, warmup + i);
      const t1 = performance.now();
      frameTimes[i] = (t1 - t0) * 1_000_000; // ms → ns
    }

    // Teardown
    scenario.teardown?.(state);

    // Memory snapshot (post-scenario, pre-GC — shows working set)
    const mem = process.memoryUsage();

    // Stats
    const stats = computeStats(frameTimes);

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

    // Live status
    process.stderr.write(
      `  cycle ${String(cycle).padStart(4)} | ${scenario.id.padEnd(22)} | p50 ${formatNs(stats.p50).padStart(10)} | heap ${entry.heapUsedMB} MB\n`,
    );
  }

  const cycleMs = ((performance.now() - cycleStart) / 1000).toFixed(1);
  process.stderr.write(`  --- cycle ${cycle} done (${cycleMs}s) ---\n`);
  cycle++;
}

process.stderr.write(`\nsoak: ${cycle} cycles completed, log at ${LOG_PATH}\n`);
