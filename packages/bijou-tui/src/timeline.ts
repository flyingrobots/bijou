/**
 * Pure GSAP-style timeline state machine for position-based animation.
 *
 * Build a definition with `timeline()`, then advance its immutable state in a
 * TEA update loop with `Timeline.step()`.
 */

export { timeline } from './timeline-builder.js';
export type {
  Position,
  SpringTrackDef,
  Timeline,
  TimelineBuilder,
  TimelineState,
  TrackDef,
  TweenTrackDef,
} from './timeline-contract.js';
