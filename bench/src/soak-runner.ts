/**
 * Soak runner — HEADED visual demo of the rendering pipeline.
 *
 * Cycles through bench scenarios and RENDERS their output to the
 * actual terminal via the real byte-pipeline differ. You see the
 * gradient animating, cells flickering, the dogfood layout composing.
 * A status bar shows the current scenario, frame time, and cycle.
 *
 * Press q, Esc, or Ctrl+C to quit.
 *
 * Usage:
 *   npm run soak                       # run until quit
 *   npm run soak -- --cycles=5         # stop after N cycles
 *   npm run soak -- --fps=30           # throttle frame rate
 *   npm run soak -- --dwell=3          # seconds per scenario
 */

import { appendFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createSurface,
  renderDiff,
  type Surface,
} from '@flyingrobots/bijou';
import { createNodeContext } from '@flyingrobots/bijou-node';
import { SCENARIOS } from './scenarios/index.js';
import { computeStats, formatNs } from './stats.js';

// --- CLI args ---
const argv = process.argv.slice(2);
function argNum(name: string, fallback: number): number {
  const match = argv.find((a) => a.startsWith(`--${name}=`));
  return match ? parseFloat(match.split('=')[1]!) : fallback;
}
function argStr(name: string, fallback: string): string {
  const match = argv.find((a) => a.startsWith(`--${name}=`));
  return match ? match.split('=')[1]! : fallback;
}

const MAX_CYCLES = argNum('cycles', Infinity);
const TARGET_FPS = argNum('fps', 30);
const DWELL_SECS = argNum('dwell', 4);
const LOG_PATH = resolve(argStr('out', 'bench/soak.jsonl'));

// Scenarios that have a display surface to show.
const scenarios = SCENARIOS.filter((s) => s.getDisplaySurface !== undefined);

// --- Terminal setup ---
const ctx = createNodeContext();
const io = ctx.io;
const style = ctx.style;

const cols = process.stdout.columns ?? 220;
const rows = process.stdout.rows ?? 58;

let quit = false;
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', (data: Buffer) => {
    const ch = data[0]!;
    if (ch === 0x71 || ch === 0x51 || ch === 0x1b || ch === 0x03) {
      quit = true;
    }
  });
}
process.on('SIGINT', () => { quit = true; });

// ANSI helpers
const ESC = '\x1b[';
const ENTER_ALT = ESC + '?1049h';
const EXIT_ALT = ESC + '?1049l';
const HIDE_CURSOR = ESC + '?25l';
const SHOW_CURSOR = ESC + '?25h';
const CLEAR = ESC + '2J' + ESC + 'H';
const WRAP_OFF = ESC + '?7l';
const WRAP_ON = ESC + '?7h';

// Log file
if (!existsSync(LOG_PATH)) writeFileSync(LOG_PATH, '');

// --- Status bar rendering ---
function drawStatusBar(
  scenarioLabel: string,
  frameIdx: number,
  frameTimeNs: number,
  cycle: number,
  scenarioIdx: number,
  total: number,
): void {
  const row = rows;
  const ft = formatNs(frameTimeNs);
  const left = ` ${scenarioLabel}  frame ${frameIdx}  ${ft}/frame`;
  const right = `cycle ${cycle}  [${scenarioIdx + 1}/${total}]  q to quit `;
  const pad = Math.max(0, cols - left.length - right.length);
  const bar = `${ESC}${row};1H${ESC}7m${left}${' '.repeat(pad)}${right}${ESC}0m`;
  process.stdout.write(bar);
}

// --- Main loop ---
async function main(): Promise<void> {
  io.write(ENTER_ALT + HIDE_CURSOR + WRAP_OFF + CLEAR);

  // Rendering surfaces sized to terminal minus 1 row for status bar.
  const renderRows = rows - 1;
  let currentSurface: Surface = createSurface(cols, renderRows);
  let displaySurface: Surface = createSurface(cols, renderRows);

  const frameIntervalMs = 1000 / TARGET_FPS;
  let cycle = 0;

  try {
    while (!quit && cycle < MAX_CYCLES) {
      for (let si = 0; si < scenarios.length && !quit; si++) {
        const scenario = scenarios[si]!;
        const state = scenario.setup();

        // Warmup (untimed, off-screen)
        for (let w = 0; w < scenario.defaultWarmupFrames && !quit; w++) {
          scenario.frame(state, w);
        }

        // Clear current surface for the new scenario (force full redraw).
        currentSurface = createSurface(cols, renderRows);

        const dwellFrames = Math.ceil(DWELL_SECS * TARGET_FPS);
        const frameTimes: number[] = [];
        const startFrame = scenario.defaultWarmupFrames;

        for (let f = 0; f < dwellFrames && !quit; f++) {
          const t0 = performance.now();

          // Run the scenario frame
          scenario.frame(state, startFrame + f);

          // Get the display surface and blit it to our render surface
          const sceneSurface = scenario.getDisplaySurface!(state);
          if (sceneSurface) {
            displaySurface = createSurface(cols, renderRows);
            displaySurface.blit(sceneSurface, 0, 0);
          }

          // Render to terminal via the real byte pipeline
          renderDiff(currentSurface, displaySurface, io, style);

          // Swap
          const prev = currentSurface;
          currentSurface = displaySurface;
          displaySurface = prev;

          const t1 = performance.now();
          const frameNs = (t1 - t0) * 1_000_000;
          frameTimes.push(frameNs);

          // Status bar
          drawStatusBar(scenario.label, f + 1, frameNs, cycle, si, scenarios.length);

          // Throttle to target FPS
          const elapsed = t1 - t0;
          const sleepMs = frameIntervalMs - elapsed;
          if (sleepMs > 1) {
            await new Promise((r) => setTimeout(r, sleepMs));
          } else {
            // Yield to let stdin events process
            await new Promise((r) => setTimeout(r, 0));
          }
        }

        // Log this scenario run
        const stats = computeStats(frameTimes);
        const mem = process.memoryUsage();
        const entry = {
          ts: new Date().toISOString(),
          cycle,
          scenario: scenario.id,
          frames: frameTimes.length,
          nsPerFrame: Math.round(stats.mean),
          p50: Math.round(stats.p50),
          p90: Math.round(stats.p90),
          p99: Math.round(stats.p99),
          covPct: Math.round(stats.cov * 1000) / 10,
          heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024 * 10) / 10,
          rssMB: Math.round(mem.rss / 1024 / 1024 * 10) / 10,
        };
        appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');

        scenario.teardown?.(state);
      }

      cycle++;
    }
  } finally {
    io.write(SHOW_CURSOR + WRAP_ON + EXIT_ALT);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
    console.log(`soak: ${cycle} cycles, log at ${LOG_PATH}`);
  }
}

main().catch((err) => {
  io.write(SHOW_CURSOR + WRAP_ON + EXIT_ALT);
  console.error(err);
  process.exit(1);
});
