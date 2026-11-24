import { createTestContext, mockClock, type MockClock, type TestContext } from '../../packages/bijou/src/adapters/test/index.js';
import { setDefaultContext as setBuiltDefaultContext } from '@flyingrobots/bijou';
import { setDefaultContext, type Surface } from '../../packages/bijou/src/index.js';
import { chalkStyle } from '../../packages/bijou-node/src/index.js';
import { isPulseMsg, QUIT, runScript, type App, type Cmd, type ScriptStep } from '../../packages/bijou-tui/src/index.js';
import type { CmdResult } from '../../packages/bijou-tui/src/runtime-commands.js';

export const KEY = {
  enter: '\r', escape: '\x1b', up: '\x1b[A', down: '\x1b[B', right: '\x1b[C', left: '\x1b[D', ctrlP: '\x10', f2: '\x1bOQ',
} as const;

export interface ClipOptions {
  readonly seconds: number;
  readonly fps: number;
  /** Raw key strings at timestamps in seconds. */
  readonly keys?: readonly (readonly [number, string])[];
  /** BCSS stylesheet, as the app would pass to run(). */
  readonly css?: string;
}

export interface ClipContext {
  readonly ctx: TestContext;
  readonly clock: MockClock;
}

/** A deterministic, styled, interactive-mode context on a mock clock, for recording any Bijou app. */
export function createClipContext(cols: number, rows: number): ClipContext {
  const clock = mockClock({ nowMs: Date.UTC(2026, 10, 15) });
  const ctx = createTestContext({ mode: 'interactive', style: chalkStyle({ level: 3 }), runtime: { columns: cols, rows }, clock });
  // Some shell decisions (quit confirmation) read the default context, as they would in a live terminal.
  // bijou-tui's source imports the built @flyingrobots/bijou, which keeps its own registry, so set both.
  setDefaultContext(ctx);
  setBuiltDefaultContext(ctx);
  return { clock, ctx };
}

/** A command result that is a message: not empty, not a quit, and not a cleanup handle. */
function isMessage<M>(value: CmdResult<M>): value is M {
  if (value === undefined || value === QUIT || typeof value === 'function') return false;
  return !(typeof value === 'object' && value !== null && 'dispose' in value);
}

/**
 * A command that runs without holding up the script. runScript drains every command before its next step, so a
 * command sleeping on the mock clock (a notification's auto-dismiss, say) would wait for a pulse that never comes.
 * Async results still arrive: a message is emitted when the command settles.
 */
function detached<M>(cmd: Cmd<M>): Cmd<M> {
  return (emit, capabilities) => {
    const result = cmd(emit, capabilities);
    if (!(result instanceof Promise)) return result;
    void result.then((value) => { if (isMessage(value)) emit(value); });
    return undefined;
  };
}

/**
 * Drive a real Bijou app with scripted keys and fixed-step pulses, and keep exactly one frame per pulse.
 * The mock clock advances with each pulse, so wall-clock animations (DOGFOOD's title) play in step.
 */
export async function recordClip<Model, M>(app: App<Model, M>, { ctx, clock }: ClipContext, options: ClipOptions): Promise<Surface[]> {
  const dt = 1 / options.fps;
  const steps: ScriptStep<M>[] = [];
  const pending = [...(options.keys ?? [])];
  const total = Math.round(options.seconds * options.fps);
  for (let i = 0; i < total; i++) {
    while (pending.length > 0 && (pending[0]?.[0] ?? Infinity) <= i * dt) {
      const next = pending.shift();
      if (next !== undefined) steps.push({ key: next[1] });
    }
    steps.push({ pulse: { dt } });
  }
  let lastWasPulse = false;
  const wrapped: App<Model, M> = {
    ...app,
    update: (msg, model) => {
      const pulse = isPulseMsg(msg);
      // Advance first: due timers may emit nested messages, which must not clear this pulse's flag.
      if (pulse) clock.advanceBy(dt * 1000);
      lastWasPulse = pulse;
      const [next, cmds] = app.update(msg, model);
      return [next, cmds.map(detached)];
    },
  };
  const frames: Surface[] = [];
  await runScript(wrapped, steps, {
    ctx, pulseFps: false, ...(options.css === undefined ? {} : { css: options.css }),
    // runScript hands onFrame a snapshot, so the frame can be kept as it is.
    onFrame: (frame, index) => { if (index > 0 && lastWasPulse) frames.push(frame); },
  });
  return frames;
}
