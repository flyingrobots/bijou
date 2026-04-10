/**
 * Soak runner — per-frame timing with live progress and stability analysis.
 *
 * Unlike the wall-time harness which spawns child processes and reports
 * aggregate stats, this runner executes the soak scenario in-process and
 * times every frame individually. The output answers: "is frame 900 as
 * fast as frame 10?"
 *
 * Usage:
 *   node --import tsx bench/src/soak-runner.ts [--frames=N] [--warmup=N]
 *
 * Outputs:
 *   - Live progress line: frame count / elapsed / current frame µs
 *   - Per-window p50 comparison: early (50-250), mid (375-625), late (750-1000)
 *   - Drift indicator: late p50 vs early p50 as a percentage
 */

import { soak } from './scenarios/soak.js';
import { computeStats, formatNs } from './stats.js';

// --- CLI args ---
const args = process.argv.slice(2);
function argInt(name: string, fallback: number): number {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  return match ? parseInt(match.split('=')[1]!, 10) : fallback;
}
const WARMUP = argInt('warmup', soak.defaultWarmupFrames);
const FRAMES = argInt('frames', soak.defaultMeasureFrames);

// --- Run ---
const state = soak.setup();
const frameTimes: number[] = new Array(FRAMES);
const startWall = performance.now();

// Warmup (untimed)
process.stderr.write(`soak: warming up (${WARMUP} frames)...\r`);
for (let i = 0; i < WARMUP; i++) {
  soak.frame(state, i);
}

// Measurement
process.stderr.write(`soak: measuring ${FRAMES} frames\n`);
const measureStart = performance.now();

for (let i = 0; i < FRAMES; i++) {
  const t0 = performance.now();
  soak.frame(state, WARMUP + i);
  const t1 = performance.now();
  frameTimes[i] = (t1 - t0) * 1_000_000; // ms → ns

  // Live progress every 50 frames
  if (i % 50 === 49 || i === FRAMES - 1) {
    const elapsed = ((performance.now() - measureStart) / 1000).toFixed(1);
    const current = formatNs(frameTimes[i]!);
    process.stderr.write(`  frame ${String(i + 1).padStart(5)}/${FRAMES}  elapsed ${elapsed}s  last ${current}\r`);
  }
}

const totalElapsed = ((performance.now() - startWall) / 1000).toFixed(2);
process.stderr.write('\n\n');

// --- Analysis ---
// Split into three windows for stability comparison.
const earlyStart = Math.min(50, Math.floor(FRAMES * 0.05));
const earlyEnd = Math.min(250, Math.floor(FRAMES * 0.25));
const midStart = Math.floor(FRAMES * 0.375);
const midEnd = Math.floor(FRAMES * 0.625);
const lateStart = Math.floor(FRAMES * 0.75);
const lateEnd = FRAMES;

const earlyWindow = frameTimes.slice(earlyStart, earlyEnd);
const midWindow = frameTimes.slice(midStart, midEnd);
const lateWindow = frameTimes.slice(lateStart, lateEnd);
const allStats = computeStats(frameTimes);
const earlyStats = computeStats(earlyWindow);
const midStats = computeStats(midWindow);
const lateStats = computeStats(lateWindow);

const drift = earlyStats.p50 !== 0
  ? ((lateStats.p50 - earlyStats.p50) / earlyStats.p50) * 100
  : 0;
const driftSign = drift >= 0 ? '+' : '';
const driftLabel = Math.abs(drift) < 3 ? 'stable' : (drift > 0 ? 'DEGRADED' : 'improved');

// --- Output ---
console.log(`soak — ${FRAMES} frames, ${WARMUP} warmup, ${totalElapsed}s total`);
console.log('');
console.log('| Window | Frames | P50 | P90 | P99 | CoV |');
console.log('|---|---|---|---|---|---|');
console.log(`| overall | 0–${FRAMES} | ${formatNs(allStats.p50)} | ${formatNs(allStats.p90)} | ${formatNs(allStats.p99)} | ${(allStats.cov * 100).toFixed(1)}% |`);
console.log(`| early | ${earlyStart}–${earlyEnd} | ${formatNs(earlyStats.p50)} | ${formatNs(earlyStats.p90)} | ${formatNs(earlyStats.p99)} | ${(earlyStats.cov * 100).toFixed(1)}% |`);
console.log(`| mid | ${midStart}–${midEnd} | ${formatNs(midStats.p50)} | ${formatNs(midStats.p90)} | ${formatNs(midStats.p99)} | ${(midStats.cov * 100).toFixed(1)}% |`);
console.log(`| late | ${lateStart}–${lateEnd} | ${formatNs(lateStats.p50)} | ${formatNs(lateStats.p90)} | ${formatNs(lateStats.p99)} | ${(lateStats.cov * 100).toFixed(1)}% |`);
console.log('');
console.log(`drift: late vs early p50 = ${driftSign}${drift.toFixed(1)}% (${driftLabel})`);
