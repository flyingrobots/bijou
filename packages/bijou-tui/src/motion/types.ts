import type { LayoutRect } from '@flyingrobots/bijou';
import type { SpringConfig, SpringPreset } from '../spring.js';

/**
 * Options for the motion() declarative wrapper.
 */
export interface MotionOptions {
  /** 
   * A unique key to track this component across frames. 
   * Essential for stable transitions during list re-ordering.
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
   * Initial layout or properties when the component first appears.
   * e.g. { opacity: 0, x: -10 }
   */
  initial?: Partial<LayoutRect & { opacity: number }>;
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
  /** Whether the motion has settled. */
  done: boolean;
}
