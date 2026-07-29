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
  resolveSpringConfig,
  EASINGS,
} from './spring.js';
import {
  createSpringCmd,
  resolveMaxPulseSeconds,
  resolvePositiveSeconds,
} from './animate.part02.js';
import { createTweenCmd } from './animate.part03.js';
import { DEFAULT_SPRING_FIXED_STEP_SECONDS } from './animate-constants.js';

// ---------------------------------------------------------------------------
// Animate options
// ---------------------------------------------------------------------------

/**
 * Shared options for both spring and tween animations.
 *
 * @template M - The message type emitted into the TEA update cycle.
 */
export interface AnimateBase<M> {
  /** Starting value. */
  readonly from: number;
  /** Target value. */
  readonly to: number;
  /** Skip animation — jump to target in one frame. Default: false. */
  readonly immediate?: boolean;
  /** Called each frame with the interpolated value. Return a message for TEA. */
  readonly onFrame: (value: number) => M;
  /** Optional message to emit when the animation is fully complete. */
  readonly onComplete?: () => M;
}
/**
 * Options for a spring-based animation (the default mode).
 *
 * @template M - The message type emitted into the TEA update cycle.
 */
export interface SpringAnimateOptions<M> extends AnimateBase<M> {
  /** Animation mode discriminator. Omit or set to `'spring'` for spring physics. */
  readonly type?: 'spring';
  /** Spring config — preset name or custom values. */
  readonly spring?: Partial<SpringConfig> | SpringPreset;
  /** Integration step in seconds. Defaults to 1/120 for stable spring physics. */
  readonly fixedStepSeconds?: number;
  /** Maximum pulse time accepted in one runtime pulse. Defaults to 1/20. */
  readonly maxPulseSeconds?: number;
}
/**
 * Options for a duration-based tween animation.
 *
 * @template M - The message type emitted into the TEA update cycle.
 */
export interface TweenAnimateOptions<M> extends AnimateBase<M> {
  /** Animation mode discriminator. Must be `'tween'` for tween mode. */
  readonly type: 'tween';
  /** Duration in milliseconds. */
  readonly duration: number;
  /** Easing function. Default: easeOutCubic. */
  readonly ease?: EasingFn;
}
/**
 * Discriminated union of spring and tween animation options.
 *
 * @template M - The message type emitted into the TEA update cycle.
 */
export type AnimateOptions<M> =
  SpringAnimateOptions<M> | TweenAnimateOptions<M>;
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
 * @template M - The message type emitted into the TEA update cycle.
 * @param options - Animation configuration (spring or tween).
 * @returns A TEA command that emits `onFrame` messages as the animation progresses.
 */
export function animate<M>(options: AnimateOptions<M>): Cmd<M> {
  const { from, to, immediate = false, onFrame, onComplete } = options;

  // Immediate mode — single frame, no physics
  if (immediate) {
    return (emit) => {
      emit(onFrame(to));
      if (onComplete) emit(onComplete());
      return undefined;
    };
  }

  if (options.type === 'tween') {
    return createTweenCmd(
      from,
      to,
      options.duration,
      options.ease ?? EASINGS.easeOutCubic,
      onFrame,
      onComplete,
    );
  }

  const config = resolveSpringConfig(options.spring);
  return createSpringCmd(
    from,
    to,
    config,
    {
      fixedStepSeconds: resolvePositiveSeconds(
        options.fixedStepSeconds,
        DEFAULT_SPRING_FIXED_STEP_SECONDS,
      ),
      maxPulseSeconds: resolveMaxPulseSeconds(
        options.maxPulseSeconds,
        options.fixedStepSeconds,
      ),
    },
    onFrame,
    onComplete,
  );
}
