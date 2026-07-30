import type {
  OverflowBehavior,
} from '@flyingrobots/bijou';
import type {
  NotificationPlacement,
} from './notification.js';

/** Configuration for frame-managed runtime notifications. */
export interface FrameRuntimeNotificationOptions {
  /** Enable routing framework warnings/errors through notifications. Default: true. */
  readonly enabled?: boolean;
  /** Stack placement. Default: 'LOWER_RIGHT'. */
  readonly placement?: NotificationPlacement;
  /** Auto-dismiss delay. Default: 6000ms. */
  readonly durationMs?: number | null;
  /** Render margin from the viewport edge. Default: 1. */
  readonly margin?: number;
  /** Gap between stacked notifications. Default: 1. */
  readonly gap?: number;
  /** Text overflow behavior. Default: 'wrap'. */
  readonly overflow?: OverflowBehavior;
}
