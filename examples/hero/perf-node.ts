import type { MemorySampler } from './perf.js';

/** The Node adapter of the memory port: the process's heap in use and resident set. */
export const nodeMemory: MemorySampler = () => {
  const mem = process.memoryUsage();
  return { heapUsedMB: mem.heapUsed / 2 ** 20, rssMB: mem.rss / 2 ** 20 };
};
