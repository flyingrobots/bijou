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
  type SpringConfig,
  type SpringPreset,
  type EasingFn,
  springStep,
  createSpringState,
  resolveSpringConfig,
  tweenStep,
  createTweenState,
  resolveTweenConfig,
  EASINGS,
} from './spring.js';

// ---------------------------------------------------------------------------
// Animate options
// ---------------------------------------------------------------------------

interface AnimateBase<M> {
  /** Starting value. */
  readonly from: number;
  /** Target value. */
  readonly to: number;
  /** Frames per second. Default: 60. */
  readonly fps?: number;
  /** Skip animation — jump to target in one frame. Default: false. */
  readonly immediate?: boolean;
  /** Called each frame with the interpolated value. Return a message for TEA. */
  readonly onFrame: (value: number) => M;
  /** Optional message to emit when the animation is fully complete. */
  readonly onComplete?: () => M;
}

export interface SpringAnimateOptions<M> extends AnimateBase<M> {
  readonly type?: 'spring';
  /** Spring config — preset name or custom values. */
  readonly spring?: Partial<SpringConfig> | SpringPreset;
}

export interface TweenAnimateOptions<M> extends AnimateBase<M> {
  readonly type: 'tween';
  /** Duration in milliseconds. */
  readonly duration: number;
  /** Easing function. Default: easeOutCubic. */
  readonly ease?: EasingFn;
}

export type AnimateOptions<M> = SpringAnimateOptions<M> | TweenAnimateOptions<M>;

// ---------------------------------------------------------------------------
// animate() — the main API
// ---------------------------------------------------------------------------

/**
 * Create a TEA command that drives an animation.
 *
 * Spring mode (default):
 * ```ts
 * animate({ from: 0, to: 100, spring: 'wobbly', onFrame: (v) => ({ type: 'scroll', y: v }) })
 * ```
 */
export function animate<M>(options: AnimateOptions<M>): Cmd<M> {
  const { from, to, fps = 60, immediate = false, onFrame, onComplete } = options;

  // Immediate mode — single frame, no physics
  if (immediate) {
    return async (emit) => {
      emit(onFrame(to));
      if (onComplete) emit(onComplete());
    };
  }

  if (options.type === 'tween') {
    return createTweenCmd(from, to, options.duration, options.ease ?? EASINGS.easeOutCubic, fps, onFrame, onComplete);
  }

  const config = resolveSpringConfig(options.spring);
  return createSpringCmd(from, to, config, fps, onFrame, onComplete);
}

// ---------------------------------------------------------------------------
// Internal: spring command
// ---------------------------------------------------------------------------

function createSpringCmd<M>(
  from: number,
  to: number,
  config: SpringConfig,
  fps: number,
  onFrame: (value: number) => M,
  onComplete?: () => M,
): Cmd<M> {
  return (emit) =>
    new Promise<void>((resolve) => {
      let state = createSpringState(from);
      const dt = 1 / fps;
      const intervalMs = Math.round(1000 / fps);

      const id = setInterval(() => {
        state = springStep(state, to, config, dt);
        emit(onFrame(state.value));

        if (state.done) {
          clearInterval(id);
          if (onComplete) emit(onComplete());
          resolve();
        }
      }, intervalMs);
    });
}

// ---------------------------------------------------------------------------
// Internal: tween command
// ---------------------------------------------------------------------------

function createTweenCmd<M>(
  from: number,
  to: number,
  duration: number,
  ease: EasingFn,
  fps: number,
  onFrame: (value: number) => M,
  onComplete?: () => M,
): Cmd<M> {
  const config = resolveTweenConfig({ from, to, duration, ease });

  return (emit) =>
    new Promise<void>((resolve) => {
      let state = createTweenState(from);
      const intervalMs = Math.round(1000 / fps);

      const id = setInterval(() => {
        state = tweenStep(state, config, intervalMs);
        emit(onFrame(state.value));

        if (state.done) {
          clearInterval(id);
          if (onComplete) emit(onComplete());
          resolve();
        }
      }, intervalMs);
    });
}

// ---------------------------------------------------------------------------
// sequence() — chain animations like a GSAP timeline
// ---------------------------------------------------------------------------

/**
 * Run animations in sequence. Each animation completes before the next starts.
 */
export function sequence<M>(...cmds: Cmd<M>[]): Cmd<M> {
  return async (emit) => {
    for (const cmd of cmds) {
      await cmd(emit);
    }
  };
}
