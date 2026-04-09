/**
 * Wall-time harness — child process.
 *
 * Runs ONE sample of ONE scenario in total isolation, prints a
 * single JSON line to stdout, and exits. This is the measurement
 * primitive: one child == one sample.
 *
 * Process isolation means:
 *   - Fresh V8 isolate, fresh JIT state, fresh heap
 *   - No GC state bleeding from prior samples
 *   - No accumulated module state across samples
 *   - Fair first-run vs subsequent-run comparison (every sample is
 *     a "first run" from a new process's perspective, stabilized by
 *     the scenario's own warmup loop)
 *
 * Usage (invoked by the runner, not by hand):
 *   node --import tsx child.ts \
 *     --scenario=paint-gradient-rgb \
 *     --sample=3 \
 *     --warmup=30 \
 *     --frames=200
 *
 * Output (single line to stdout):
 *   {"scenarioId":"paint-gradient-rgb","sampleIndex":3,"elapsedNs":12345678,"frames":200,"nsPerFrame":61728}
 *
 * Anything written to stderr is considered diagnostic and is passed
 * through by the parent runner.
 */

import { getScenario } from '../../scenarios/index.js';

interface ChildArgs {
  readonly scenarioId: string;
  readonly sampleIndex: number;
  readonly warmupFrames: number;
  readonly measureFrames: number;
}

function parseArgs(argv: readonly string[]): ChildArgs {
  let scenarioId: string | undefined;
  let sampleIndex: number | undefined;
  let warmupFrames: number | undefined;
  let measureFrames: number | undefined;

  for (const arg of argv) {
    const eq = arg.indexOf('=');
    if (eq === -1) continue;
    const key = arg.slice(0, eq);
    const value = arg.slice(eq + 1);
    switch (key) {
      case '--scenario':
        scenarioId = value;
        break;
      case '--sample':
        sampleIndex = Number.parseInt(value, 10);
        break;
      case '--warmup':
        warmupFrames = Number.parseInt(value, 10);
        break;
      case '--frames':
        measureFrames = Number.parseInt(value, 10);
        break;
      default:
        // ignore unknown flags — the runner may pass extras
        break;
    }
  }

  if (scenarioId === undefined) throw new Error('missing --scenario');
  if (sampleIndex === undefined || !Number.isFinite(sampleIndex)) throw new Error('missing --sample');
  if (warmupFrames === undefined || !Number.isFinite(warmupFrames) || warmupFrames < 0) {
    throw new Error('missing --warmup');
  }
  if (measureFrames === undefined || !Number.isFinite(measureFrames) || measureFrames <= 0) {
    throw new Error('missing --frames');
  }

  return { scenarioId, sampleIndex, warmupFrames, measureFrames };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const scenario = getScenario(args.scenarioId);

  // Setup is outside the timing window.
  const state = scenario.setup();

  // Warmup is also outside the timing window.
  for (let i = 0; i < args.warmupFrames; i++) {
    scenario.frame(state, i);
  }

  // Timed measurement. Use hrtime.bigint for nanosecond-resolution
  // monotonic clock. No per-frame timing — just total elapsed across
  // the measured window, divided by frame count.
  const start = process.hrtime.bigint();
  for (let i = 0; i < args.measureFrames; i++) {
    scenario.frame(state, args.warmupFrames + i);
  }
  const elapsedNs = Number(process.hrtime.bigint() - start);

  // Teardown is outside the timing window.
  scenario.teardown?.(state);

  const result = {
    scenarioId: args.scenarioId,
    sampleIndex: args.sampleIndex,
    elapsedNs,
    frames: args.measureFrames,
    nsPerFrame: elapsedNs / args.measureFrames,
  };

  process.stdout.write(JSON.stringify(result) + '\n');
}

main();
