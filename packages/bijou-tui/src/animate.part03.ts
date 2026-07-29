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
import {
  type EasingFn,
  tweenStep,
  createTweenState,
  resolveTweenConfig,
} from './spring.js';

// ---------------------------------------------------------------------------
// Internal: tween command
// ---------------------------------------------------------------------------

/**
 * Build a TEA command that advances a tween animation from runtime pulse `dt`.
 *
 * The command subscribes through `caps.onPulse`; each pulse supplies elapsed
 * seconds, which are converted to milliseconds before calling `tweenStep()`.
 *
 * @template M - The message type emitted into the TEA update cycle.
 * @param from       - Starting value.
 * @param to         - Target value.
 * @param duration   - Total animation duration in milliseconds.
 * @param ease       - Easing function applied to normalized progress.
 * @param onFrame    - Callback invoked after tween progress advances.
 * @param onComplete - Optional callback invoked when the tween completes.
 * @returns A TEA command that resolves when the tween is done.
 */
export function createTweenCmd<M>(
  from: number,
  to: number,
  duration: number,
  ease: EasingFn,
  onFrame: (value: number) => M,
  onComplete?: () => M,
): Cmd<M> {
  const config = resolveTweenConfig({ from, to, duration, ease });

  return (emit, caps) =>
    new Promise<undefined>((resolve) => {
      let state = createTweenState(from);

      const handle = caps.onPulse((dt) => {
        // tweenStep expects the pulse delta in milliseconds.
        state = tweenStep(state, config, dt * 1000);
        emit(onFrame(state.value));

        if (state.done) {
          handle.dispose();
          if (onComplete) emit(onComplete());
          resolve(undefined);
        }
      });
    });
}
/**
 * Run animations in sequence. Each animation completes before the next starts.
 *
 * @template M - The message type emitted into the TEA update cycle.
 * @param cmds - Ordered TEA commands (typically from {@link animate}) to chain.
 * @returns A single TEA command that runs all commands serially.
 */
export function sequence<M>(...cmds: Cmd<M>[]): Cmd<M> {
  return async (emit, caps) => {
    for (const cmd of cmds) {
      await cmd(emit, caps);
    }
    return undefined;
  };
}
