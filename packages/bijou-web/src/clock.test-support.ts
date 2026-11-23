import type { WebCancel, WebClockHost } from './clock.js';

interface FakeTimer {
  due: number;
  readonly every: number | undefined;
  readonly callback: () => void;
}

/** Deterministic in-memory clock host with inspectable live handles. */
export interface FakeClockHost extends WebClockHost {
  /** Number of host timers that are scheduled and not cancelled. */
  liveTimers(): number;
  /** Number of frame callbacks that are requested and not cancelled. */
  liveFrames(): number;
  /** Move time forward and run every timer that falls due, in order. */
  advance(ms: number): void;
  /** Run queued microtasks until the queue is empty. */
  flushMicrotasks(): void;
  /** Run every requested frame callback with the given timestamp. */
  frame(timestampMs: number): void;
}

function nextDue(timers: ReadonlyMap<number, FakeTimer>, end: number): number | undefined {
  let found: number | undefined;
  let due = Infinity;
  for (const [id, timer] of timers) {
    if (timer.due <= end && timer.due < due) {
      found = id;
      due = timer.due;
    }
  }
  return found;
}

/** Create a fake host. `frames: false` models a host without frame scheduling. */
export function createFakeClockHost(options: { startMs?: number; frames?: boolean } = {}): FakeClockHost {
  const startMs = options.startMs ?? 1_000;
  let time = startMs;
  let nextId = 1;
  const timers = new Map<number, FakeTimer>();
  const frames = new Map<number, (timestampMs: number) => void>();
  const microtasks: (() => void)[] = [];

  const schedule = (callback: () => void, ms: number, repeat: boolean): WebCancel => {
    const id = nextId++;
    timers.set(id, { due: time + ms, every: repeat ? Math.max(1, ms) : undefined, callback });
    return () => { timers.delete(id); };
  };

  const host: FakeClockHost = {
    now: () => time,
    monotonicNow: () => time - startMs,
    setTimeout: (callback, ms) => schedule(callback, ms, false),
    setInterval: (callback, ms) => schedule(callback, ms, true),
    queueMicrotask: (callback) => { microtasks.push(callback); },
    requestFrame: undefined,
    liveTimers: () => timers.size,
    liveFrames: () => frames.size,
    advance: (ms) => {
      const end = time + ms;
      for (let id = nextDue(timers, end); id !== undefined; id = nextDue(timers, end)) {
        const timer = timers.get(id);
        if (timer === undefined) break;
        time = timer.due;
        if (timer.every === undefined) timers.delete(id);
        else timer.due += timer.every;
        timer.callback();
      }
      time = end;
    },
    flushMicrotasks: () => {
      for (let task = microtasks.shift(); task !== undefined; task = microtasks.shift()) task();
    },
    frame: (timestampMs) => {
      const due = [...frames.values()];
      frames.clear();
      for (const callback of due) callback(timestampMs);
    },
  };
  if (options.frames === false) return host;
  return {
    ...host,
    requestFrame: (callback) => {
      const id = nextId++;
      frames.set(id, callback);
      return () => { frames.delete(id); };
    },
  };
}
