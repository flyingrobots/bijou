import { EASINGS } from './spring.part01.js';

import type { EasingFn } from './spring.part01.js';
export interface TweenConfig {
  /** Start value. Default: 0 */
  readonly from: number;
  /** End value. Default: 1 */
  readonly to: number;
  /** Duration in milliseconds */
  readonly duration: number;
  /** Easing function. Default: easeOutCubic */
  readonly ease: EasingFn;
}
export interface TweenState {
  /** Current animated value */
  readonly value: number;
  /** Elapsed time in milliseconds */
  readonly elapsed: number;
  /** Whether the tween has completed */
  readonly done: boolean;
}
export function tweenStep(
  state: TweenState,
  config: TweenConfig,
  dtMs: number,
): TweenState {
  const elapsed = Math.min(state.elapsed + dtMs, config.duration);
  const t = config.duration > 0 ? elapsed / config.duration : 1;
  const eased = config.ease(t);
  const value = config.from + (config.to - config.from) * eased;
  const done = elapsed >= config.duration;

  return { value: done ? config.to : value, elapsed, done };
}
export function createTweenState(from: number): TweenState {
  return { value: from, elapsed: 0, done: false };
}
export function resolveTweenConfig(
  config: Partial<TweenConfig> & { duration: number },
): TweenConfig {
  return {
    from: config.from ?? 0,
    to: config.to ?? 1,
    duration: config.duration,
    ease: config.ease ?? EASINGS.easeOutCubic,
  };
}
