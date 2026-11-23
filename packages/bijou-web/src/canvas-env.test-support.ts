import { stringToSurface } from '@flyingrobots/bijou';
import { isKeyMsg, type App } from '@flyingrobots/bijou-tui';
import { createFakeBackends, type FakeBackends } from './canvas-backends.test-support.js';
import type { BijouCanvasBox, BijouCanvasHost } from './canvas-contract.js';
import { createCanvasMaker, createFakeContainer, type CanvasMaker, type FakeCanvas, type FakeContainer } from './canvas-dom.test-support.js';
import { createWebClock, type WebClock } from './clock.js';
import { createFakeClockHost, type FakeClockHost } from './clock.test-support.js';
import { withPrevent } from './interactive.test-support.js';
import type { MountBijouCanvasOptions } from './canvas-options.js';

/** A resize observer and DPR source that the test drives by hand. */
export interface FakeCanvasHost extends BijouCanvasHost {
  /** Deliver a box to every observer. */
  box(cssWidth: number, cssHeight: number, devicePixelContentBox?: { width: number; height: number }): void;
  /** Change the device pixel ratio and notify every watcher. */
  changeDpr(dpr: number): void;
  liveObservers(): number;
  liveDprWatchers(): number;
}

/** Create a host at DPR 1 with no observers. */
export function createFakeCanvasHost(): FakeCanvasHost {
  const observers = new Set<(box: BijouCanvasBox) => void>();
  const watchers = new Set<() => void>();
  let dpr = 1;
  return {
    observeResize(_target, onBox) {
      const entry = (box: BijouCanvasBox): void => { onBox(box); };
      observers.add(entry);
      return () => { observers.delete(entry); };
    },
    devicePixelRatio: () => dpr,
    watchDevicePixelRatio(onChange) {
      const entry = (): void => { onChange(); };
      watchers.add(entry);
      return () => { watchers.delete(entry); };
    },
    box(cssWidth, cssHeight, devicePixelContentBox) {
      const box = devicePixelContentBox === undefined ? { cssWidth, cssHeight } : { cssWidth, cssHeight, devicePixelContentBox };
      for (const observer of [...observers]) observer(box);
    },
    changeDpr(next) {
      dpr = next;
      for (const watcher of [...watchers]) watcher();
    },
    liveObservers: () => observers.size,
    liveDprWatchers: () => watchers.size,
  };
}

/** The counter app's model. `a` adds one. */
export interface CounterModel { readonly count: number }

/** A TEA app whose state is a count of `a` key presses. */
export const counterApp: App<CounterModel> = {
  init: () => [{ count: 0 }, []],
  update: (msg, model) => [isKeyMsg(msg) && msg.key === 'a' ? { count: model.count + 1 } : model, []],
  view: (model) => stringToSurface(`count ${String(model.count)}`, 12, 1),
};

/** Everything a canvas mount test drives. */
export interface CanvasEnv {
  readonly container: FakeContainer;
  readonly maker: CanvasMaker;
  readonly backends: FakeBackends;
  readonly host: FakeCanvasHost;
  readonly clockHost: FakeClockHost;
  readonly clock: WebClock;
  /** Options with the fakes wired in, a 10 by 20 pixel cell, and `overrides` on top. */
  options(overrides?: Partial<MountBijouCanvasOptions<FakeCanvas>>): MountBijouCanvasOptions<FakeCanvas>;
  /** Press a key in the mount's hidden textarea. */
  press(key: string): void;
  /** Run timers, microtasks, promise callbacks and frames until the mount settles. */
  drive(rounds?: number): Promise<void>;
  /** Call `stop()` and drive the fake clock until it resolves. */
  stop(handle: { stop(): Promise<void> }): Promise<void>;
  /** Listeners still attached to every textarea and canvas the test saw. */
  listeners(): number;
}

const macrotask = (): Promise<void> => new Promise((resolve) => { setTimeout(resolve, 0); });

/** Create a fresh environment. */
export function createCanvasEnv(): CanvasEnv {
  const container = createFakeContainer();
  const maker = createCanvasMaker();
  const backends = createFakeBackends();
  const host = createFakeCanvasHost();
  const clockHost = createFakeClockHost();
  const clock = createWebClock({ host: clockHost });
  let time = 0;
  return {
    container, maker, backends, host, clockHost, clock,
    options: (overrides = {}) => ({
      presenters: backends.presenters,
      createCanvas: () => maker.create(),
      cellPx: { width: 10, height: 20 },
      host,
      clock,
      ...overrides,
    }),
    press(key) {
      const textarea = container.ownerDocument.textareas.at(-1);
      if (textarea === undefined) throw new Error('no textarea was mounted');
      textarea.dispatch('keydown', withPrevent({ key }));
    },
    async drive(rounds = 12) {
      for (let round = 0; round < rounds; round++) {
        await macrotask();
        clockHost.flushMicrotasks();
        clockHost.advance(20);
        time += 20;
        clockHost.frame(time);
      }
    },
    async stop(handle) {
      const stopping = handle.stop();
      await this.drive();
      await stopping;
    },
    listeners: () => [...container.ownerDocument.textareas, ...maker.made]
      .reduce((sum, target) => sum + target.listenerCount(), 0),
  };
}
