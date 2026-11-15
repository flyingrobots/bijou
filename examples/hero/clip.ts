import { createTestContext, mockClock, type MockClock, type TestContext } from '../../packages/bijou/src/adapters/test/index.js';
import { setDefaultContext as setBuiltDefaultContext } from '@flyingrobots/bijou';
import { setDefaultContext, type Surface } from '../../packages/bijou/src/index.js';
import { chalkStyle } from '../../packages/bijou-node/src/index.js';
import { isPulseMsg, runScript, type App, type ScriptStep } from '../../packages/bijou-tui/src/index.js';

export const KEY = {
  enter: '\r', escape: '\x1b', up: '\x1b[A', down: '\x1b[B', right: '\x1b[C', left: '\x1b[D', ctrlP: '\x10', f2: '\x1bOQ',
} as const;

export interface ClipOptions {
  readonly seconds: number;
  readonly fps: number;
  /** Raw key strings at timestamps in seconds. */
  readonly keys?: readonly (readonly [number, string])[];
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
      return app.update(msg, model);
    },
  };
  const frames: Surface[] = [];
  await runScript(wrapped, steps, {
    ctx, pulseFps: false,
    // Clone: apps may reuse one surface between renders, which would alias every stored frame.
    onFrame: (frame, index) => { if (index > 0 && lastWasPulse) frames.push(frame.clone()); },
  });
  return frames;
}
