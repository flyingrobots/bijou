import type { PerfSample } from './scenes.js';

const HISTORY = 40;

/** Heap and resident memory in MB, as a host can measure them. */
export interface MemorySample {
  readonly heapUsedMB: number;
  readonly rssMB: number;
}

/**
 * The port the tracker reads memory through. `perf-node.ts` measures the Node
 * process; `perf-browser.ts` reports nothing, and the overlay then shows no
 * memory rows.
 */
export type MemorySampler = () => MemorySample | undefined;

/**
 * Measures real view cost. `fps` is what the measured frame time could sustain,
 * so the overlay stays truthful in a scripted recording as well as live.
 */
export function createPerfTracker(memory: MemorySampler): { readonly measure: <T>(render: () => T) => T; readonly sample: () => PerfSample } {
  const history: number[] = [];
  let last = 16;
  return {
    measure: (render) => {
      const start = performance.now();
      const out = render();
      last = performance.now() - start;
      history.push(last);
      if (history.length > HISTORY) history.shift();
      return out;
    },
    sample: () => {
      const mem = memory();
      const avg = history.length === 0 ? last : history.reduce((a, b) => a + b, 0) / history.length;
      return { fps: 1000 / Math.max(1, avg), frameTimeMs: last, history: [...history], ...mem };
    },
  };
}
