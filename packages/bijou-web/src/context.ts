import { createBijou } from '@flyingrobots/bijou';
import type { BijouContext, ClockPort, ColorScheme, OutputMode, Theme } from '@flyingrobots/bijou';
import { createWebClock } from './clock.js';
import { createWebOutputIO, type WebOutputIO, type WebOutputSinks } from './output-io.js';
import { createWebRuntime, type WebRuntime, type WebRuntimeOptions } from './runtime.js';
import { createWebStyle } from './style.js';

/** Options for {@link createWebContext}. */
export interface CreateWebContextOptions {
  /** Initial environment, size, refresh rate, and TTY flags. */
  readonly runtime?: WebRuntimeOptions;
  /** Destinations for output. A stream without a sink is buffered in memory. */
  readonly output?: WebOutputSinks;
  /** Clock to use for time and timers. Defaults to {@link createWebClock}. */
  readonly clock?: ClockPort;
  /**
   * Output mode. When absent, the mode is detected from the runtime:
   * `BIJOU_ACCESSIBLE=1`, `TERM=dumb`, `stdoutIsTTY`, then `CI`.
   */
  readonly mode?: OutputMode;
  /** Theme to resolve. Defaults to the core default theme. */
  readonly theme?: Theme;
  /** Named themes that the theme environment variable can select. */
  readonly presets?: Record<string, Theme>;
  /** Environment variable that selects a preset. Defaults to `BIJOU_THEME`. */
  readonly envVar?: string;
  /** Light or dark scheme. Defaults to runtime detection. */
  readonly colorScheme?: ColorScheme;
}

/** A {@link BijouContext} whose ports are the browser adapters. */
export interface WebContext extends BijouContext {
  readonly runtime: WebRuntime;
  readonly io: WebOutputIO;
  readonly clock: ClockPort;
}

/**
 * Create a {@link BijouContext} for a browser host.
 *
 * Composes the browser runtime, clock, style, and output I/O ports through
 * `createBijou()`. The context only writes output: it attaches no keyboard or
 * pointer input and mounts nothing in the page. Runtime resizes reach
 * `io.onResize()` listeners.
 *
 * @param options - Port options, output mode, and theme selection.
 * @returns The context, with its runtime and I/O narrowed to the browser types.
 */
export function createWebContext(options: CreateWebContextOptions = {}): WebContext {
  const runtime = createWebRuntime(options.runtime);
  const clock = options.clock ?? createWebClock();
  const io = createWebOutputIO({
    ...options.output,
    clock,
    resize: (callback) => runtime.onResize(callback),
  });
  const base = createBijou({
    runtime,
    io,
    clock,
    style: createWebStyle({ runtime }),
    theme: options.theme,
    presets: options.presets,
    envVar: options.envVar,
    ...(options.colorScheme === undefined ? {} : { colorScheme: options.colorScheme }),
  });
  return { ...base, mode: options.mode ?? base.mode, runtime, io, clock };
}
