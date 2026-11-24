import type { BijouContext } from '@flyingrobots/bijou';
import { createSoakApp } from './soak-app.js';
import { parseSoakQuery } from './soak-query.js';
import type { SoakHost, SoakLogSink, SoakMemory, SoakMemoryPort } from './soak-ports.js';

/**
 * The browser adapter of the soak bench's host ports, and the one module the
 * showcase's gallery loads. It names no Node API and no DOM type: a page hands
 * it the address's query and the context its scenarios render with.
 */

const NOTHING: SoakMemory = { heapUsedMB: undefined, rssMB: undefined };
const megabytes = (bytes: number): number => Math.round(bytes / 1024 / 1024 * 10) / 10;

/**
 * The memory port of a browser. Only Chrome offers `performance.memory`, and
 * its `usedJSHeapSize` is the JavaScript heap, not the resident set: it is
 * reported as `heapUsedMB` and never as `rssMB`. Where the browser offers no
 * heap figure, or a figure that cannot be a measurement, there is nothing.
 */
export function browserMemory(source: unknown = globalThis.performance): SoakMemory {
  const memory: unknown = typeof source === 'object' && source !== null ? Reflect.get(source, 'memory') : undefined;
  const used: unknown = typeof memory === 'object' && memory !== null ? Reflect.get(memory, 'usedJSHeapSize') : undefined;
  return typeof used === 'number' && Number.isFinite(used) && used > 0 ? { heapUsedMB: megabytes(used), rssMB: undefined } : NOTHING;
}

/** A log sink that keeps the last `limit` lines in memory. */
export interface LogBuffer {
  readonly sink: SoakLogSink;
  /** A copy of the kept lines, oldest first. */
  lines(): readonly string[];
}

export function createLogBuffer(limit = 200): LogBuffer {
  const kept: string[] = [];
  return {
    sink(line) {
      kept.push(line);
      if (kept.length > limit) kept.splice(0, kept.length - limit);
    },
    lines: () => [...kept],
  };
}

/** A soak bench for a browser page. Its app is built from the run's context. */
export interface BrowserSoak {
  app(ctx: BijouContext): ReturnType<typeof createSoakApp>;
  lines(): readonly string[];
}

/**
 * Make the bench for a page. `search` is the address's query; an invalid value
 * throws its message, so a page can show it. `scenarioContext` builds the
 * context each scenario's `setup` renders with.
 */
export function createBrowserSoak(search: string, scenarioContext: () => BijouContext, memory: SoakMemoryPort = browserMemory): BrowserSoak {
  const query = parseSoakQuery(search);
  if (!query.ok) throw new Error(query.message);
  const log = createLogBuffer();
  const host: SoakHost = { options: query.options, memory, log: log.sink, scenarioContext };
  return { app: (ctx) => createSoakApp(ctx, host), lines: log.lines };
}
