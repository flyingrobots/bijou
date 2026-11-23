import type { BijouContext, ClockPort } from '@flyingrobots/bijou';
import { composeWebContext, type CreateWebContextOptions } from './context.js';
import { createWebInteractiveIO, type WebInteractiveIO, type WebInteractiveIOOptions } from './interactive-io.js';
import type { WebRuntime } from './runtime.js';

/** Options for {@link createWebInteractiveContext}. */
export interface CreateWebInteractiveContextOptions extends CreateWebContextOptions {
  /**
   * The input elements and policies. The runtime, clock, resize source and
   * output sinks come from the context, so they are not set here.
   */
  readonly input?: Omit<WebInteractiveIOOptions, 'runtime' | 'clock' | 'resize' | 'write' | 'writeError' | 'writeBytes'>;
}

/** A context whose I/O port also reads browser input. */
export interface WebInteractiveContext extends BijouContext {
  readonly runtime: WebRuntime;
  readonly io: WebInteractiveIO;
  readonly clock: ClockPort;
}

/**
 * Create a {@link BijouContext} whose I/O port is
 * {@link createWebInteractiveIO}, wired to the context's runtime and clock.
 *
 * The TUI runtime reads keys and mouse input from `io.rawInput()` only, so a
 * key reaches the app once, as its terminal encoding, and a pointer event as
 * an SGR packet hit-tested against the runtime size.
 *
 * @param options - The {@link createWebContext} options plus the input elements.
 * @returns The context, with `io` narrowed to the interactive port.
 */
export function createWebInteractiveContext(options: CreateWebInteractiveContextOptions = {}): WebInteractiveContext {
  return composeWebContext(options, (runtime, clock) => createWebInteractiveIO({
    ...options.output,
    ...options.input,
    runtime,
    clock,
    resize: (callback) => runtime.onResize(callback),
  }));
}
