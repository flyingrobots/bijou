/**
 * TEA-integrated animation commands.
 *
 * GSAP-style API: `animate()` returns a `Cmd` that fires `onFrame`
 * messages as the animation progresses, fitting naturally into the
 * TEA update cycle.
 *
 * Two animation modes:
 *   - **spring**: Physics-based (default). No fixed duration — runs until
 *     the spring settles. Use for organic, responsive motion.
 *   - **tween**: Duration-based with easing curves. Use for predictable,
 *     timed transitions.
 *
 * Both modes support `immediate: true` to skip animation and jump to
 * the target value in a single frame.
 */
import type { Cmd } from './types.js';
import { type SpringConfig, springStep, createSpringState } from './spring.js';
import {
  DEFAULT_SPRING_FIXED_STEP_SECONDS,
  DEFAULT_SPRING_MAX_PULSE_SECONDS,
} from './animate-constants.js';

// ---------------------------------------------------------------------------
// Internal: spring command
// ---------------------------------------------------------------------------

export interface SpringIntegrationOptions {
  readonly fixedStepSeconds: number;
  readonly maxPulseSeconds: number;
}
/**
 * Build a TEA command that advances a spring animation from runtime pulses.
 *
 * The command subscribes through `caps.onPulse`, caps each accepted pulse with
 * `maxPulseSeconds`, and accumulates that time into fixed-step spring physics
 * updates. Slow runtime pulses may delay progress, but they do not feed one
 * large raw delta into the spring integrator.
 *
 * @template M - The message type emitted into the TEA update cycle.
 * @param from        - Starting value.
 * @param to          - Target value.
 * @param config      - Resolved spring physics parameters.
 * @param integration - `fixedStepSeconds` and `maxPulseSeconds` integration policy.
 * @param onFrame     - Callback invoked after spring physics advances.
 * @param onComplete  - Optional callback invoked when the spring settles.
 * @returns A TEA command that resolves when the spring is done.
 */
export function createSpringCmd<M>(
  from: number,
  to: number,
  config: SpringConfig,
  integration: SpringIntegrationOptions,
  onFrame: (value: number) => M,
  onComplete?: () => M,
): Cmd<M> {
  return (emit, caps) =>
    new Promise<undefined>((resolve) => {
      let state = createSpringState(from);
      let accumulatedSeconds = 0;

      const handle = caps.onPulse((dt) => {
        accumulatedSeconds = Math.min(
          integration.maxPulseSeconds,
          accumulatedSeconds +
            acceptedPulseSeconds(dt, integration.maxPulseSeconds),
        );
        let stepped = false;
        while (
          accumulatedSeconds >= integration.fixedStepSeconds &&
          !state.done
        ) {
          state = springStep(state, to, config, integration.fixedStepSeconds);
          accumulatedSeconds -= integration.fixedStepSeconds;
          stepped = true;
        }

        if (!stepped) {
          return;
        }

        emit(onFrame(state.value));

        if (state.done) {
          handle.dispose();
          if (onComplete) emit(onComplete());
          resolve(undefined);
        }
      });
    });
}
export function resolveMaxPulseSeconds(
  maxPulseSeconds: number | undefined,
  fixedStepSeconds: number | undefined,
): number {
  return Math.max(
    resolvePositiveSeconds(maxPulseSeconds, DEFAULT_SPRING_MAX_PULSE_SECONDS),
    resolvePositiveSeconds(fixedStepSeconds, DEFAULT_SPRING_FIXED_STEP_SECONDS),
  );
}
export function resolvePositiveSeconds(
  value: number | undefined,
  fallback: number,
): number {
  return value != null && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}
export function acceptedPulseSeconds(
  dt: number,
  maxPulseSeconds: number,
): number {
  if (!Number.isFinite(dt) || dt <= 0) {
    return 0;
  }
  return Math.min(dt, maxPulseSeconds);
}
