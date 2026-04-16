import type { LayoutRect } from '@flyingrobots/bijou';
import type { SpringConfig, SpringPreset } from '../spring.js';

/**
 * Options for the motion() declarative wrapper.
 */
export interface MotionOptions {
  /** 
   * A unique key to track this component across frames.
   * This must stay stable across renders. Index-like keys that appear
   * and disappear together will trigger a runtime warning because they
   * usually prevent interpolation from ever reusing prior motion state.
   */
  key: string;
  /** 
   * Transition configuration. 
   * Defaults to a 'gentle' spring.
   */
  transition?: {
    type?: 'spring' | 'tween';
    spring?: SpringPreset | SpringConfig;
    duration?: number;
  };
  /**
   * Initial layout offsets or size overrides when the component first appears.
   * e.g. { x: -10, y: 2, width: 0 }
   */
  initial?: Partial<LayoutRect>;
}

/**
 * Internal state for a tracked motion component.
 */
export interface TrackedMotion {
  key: string;
  /** The target rect we are moving towards. */
  targetRect: LayoutRect;
  /** The current interpolated rect being rendered. */
  currentRect: LayoutRect;
  /** Velocity for spring physics. */
  velocity: { x: number; y: number; w: number; h: number };
  /** Resolved motion mode for the current transition. */
  mode: 'spring' | 'tween';
  /** Elapsed time for tween transitions. */
  tweenElapsedMs: number;
  /** Starting rect for the active tween. */
  tweenFromRect: LayoutRect;
  /** Whether the motion has settled. */
  done: boolean;
}
