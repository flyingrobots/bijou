export interface MemStats {
  heapUsedMB: number;
  heapTotalMB: number;
  rssMB: number;
  externalMB: number;
  gcCountSinceLastSample: number;
}

let gcCount = 0;
let gcCountAtLastSample = 0;

try {
  const { PerformanceObserver } = await import('node:perf_hooks');
  const observer = new PerformanceObserver((list) => {
    gcCount += list.getEntries().length;
  });
  observer.observe({ entryTypes: ['gc'] });
} catch {
  // GC observation is optional; memory sampling remains available.
}

export function sampleMemStats(): MemStats {
  const memory = process.memoryUsage();
  const gcCountSinceLastSample = gcCount - gcCountAtLastSample;
  gcCountAtLastSample = gcCount;
  return {
    heapUsedMB: memory.heapUsed / (1024 * 1024),
    heapTotalMB: memory.heapTotal / (1024 * 1024),
    rssMB: memory.rss / (1024 * 1024),
    externalMB: memory.external / (1024 * 1024),
    gcCountSinceLastSample,
  };
}
