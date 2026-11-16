import type { PerfSample } from './scenes.js';

const HISTORY = 40;

/**
 * Measures real view cost. `fps` is what the measured frame time could sustain,
 * so the overlay stays truthful in a scripted recording as well as live.
 */
export function createPerfTracker(): { readonly measure: <T>(render: () => T) => T; readonly sample: () => PerfSample } {
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
      const mem = process.memoryUsage();
      const avg = history.length === 0 ? last : history.reduce((a, b) => a + b, 0) / history.length;
      return {
        fps: 1000 / Math.max(1, avg), frameTimeMs: last, history: [...history],
        heapUsedMB: mem.heapUsed / 2 ** 20, rssMB: mem.rss / 2 ** 20,
      };
    },
  };
}
