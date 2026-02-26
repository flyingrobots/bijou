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
 *
 * Tween mode:
 * ```ts
 * animate({ type: 'tween', from: 0, to: 1, duration: 300, onFrame: (v) => ({ type: 'fade', opacity: v }) })
 * ```
 *
 * No animation:
 * ```ts
 * animate({ from: 0, to: 100, immediate: true, onFrame: (v) => ({ type: 'scroll', y: v }) })
 * ```
 */
export function animate<M>(options: AnimateOptions<M>): Cmd<M> {
  const { from, to, fps = 60, immediate = false, onFrame } = options;

  // Immediate mode — single frame, no physics
  if (immediate) {
    return () => Promise.resolve(onFrame(to));
  }

  if (options.type === 'tween') {
    return createTweenCmd(from, to, options.duration, options.ease ?? EASINGS.easeOutCubic, fps, onFrame);
  }

  const config = resolveSpringConfig(options.spring);
  return createSpringCmd(from, to, config, fps, onFrame);
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
): Cmd<M> {
  return () =>
    new Promise<M>((resolve) => {
      let state = createSpringState(from);
      const dt = 1 / fps;
      const intervalMs = Math.round(1000 / fps);

      const id = setInterval(() => {
        state = springStep(state, to, config, dt);
        const msg = onFrame(state.value);

        if (state.done) {
          clearInterval(id);
          resolve(msg);
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
): Cmd<M> {
  const config = resolveTweenConfig({ from, to, duration, ease });

  return () =>
    new Promise<M>((resolve) => {
      let state = createTweenState(from);
      const intervalMs = Math.round(1000 / fps);

      const id = setInterval(() => {
        state = tweenStep(state, config, intervalMs);
        const msg = onFrame(state.value);

        if (state.done) {
          clearInterval(id);
          resolve(msg);
        }
      }, intervalMs);
    });
}

// ---------------------------------------------------------------------------
// sequence() — chain animations like a GSAP timeline
// ---------------------------------------------------------------------------

/**
 * Run animations in sequence. Each animation completes before the next starts.
 *
 * ```ts
 * sequence(
 *   animate({ from: 0, to: 100, onFrame: (v) => ({ type: 'slideIn', x: v }) }),
 *   animate({ type: 'tween', from: 0, to: 1, duration: 200, onFrame: (v) => ({ type: 'fadeIn', opacity: v }) }),
 * )
 * ```
 */
export function sequence<M>(...cmds: Cmd<M>[]): Cmd<M> {
  return async () => {
    let lastResult: M | undefined;
    for (const cmd of cmds) {
      const result = await cmd();
      if (result !== undefined) {
        lastResult = result as M;
      }
    }
    return lastResult as M;
  };
}
