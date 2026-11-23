import type { MemorySampler } from './perf.js';

/**
 * The browser adapter of the memory port. A page has no standard measure of
 * its heap or resident set, so it reports none rather than a guess.
 */
export const browserMemory: MemorySampler = () => undefined;
