export interface SpringConfig {
  /** Spring stiffness (tension). Higher = snappier. Default: 170 */
  readonly stiffness: number;
  /** Damping (friction). Higher = less oscillation. Default: 26 */
  readonly damping: number;
  /** Mass of the object. Higher = more inertia. Default: 1 */
  readonly mass: number;
  /** Value threshold to consider the spring settled. Default: 0.01 */
  readonly precision: number;
}
export const SPRING_PRESETS = {
  /** Balanced default — smooth with a hint of bounce */
  default: { stiffness: 170, damping: 26, mass: 1, precision: 0.01 },
  /** Soft entrance — slow start, gentle settle */
  gentle: { stiffness: 120, damping: 14, mass: 1, precision: 0.01 },
  /** Playful — noticeable overshoot and bounce */
  wobbly: { stiffness: 180, damping: 12, mass: 1, precision: 0.01 },
  /** Quick snap — fast with minimal overshoot */
  stiff: { stiffness: 210, damping: 20, mass: 1, precision: 0.01 },
  /** Heavy — deliberate, weighty motion */
  slow: { stiffness: 280, damping: 60, mass: 1, precision: 0.01 },
  /** Very heavy — thick, viscous feel */
  molasses: { stiffness: 280, damping: 120, mass: 1, precision: 0.01 },
} as const satisfies Record<string, SpringConfig>;
export type SpringPreset = keyof typeof SPRING_PRESETS;
export interface SpringState {
  /** Current animated value */
  readonly value: number;
  /** Current velocity */
  readonly velocity: number;
  /** Whether the spring has settled at the target */
  readonly done: boolean;
}
export function springStep(
  state: SpringState,
  target: number,
  config: SpringConfig,
  dt: number,
): SpringState {
  const { stiffness, damping, mass, precision } = config;

  const displacement = state.value - target;
  const springForce = -stiffness * displacement;
  const dampingForce = -damping * state.velocity;
  const acceleration = (springForce + dampingForce) / mass;

  const velocity = state.velocity + acceleration * dt;
  const value = state.value + velocity * dt;

  const done =
    Math.abs(velocity) < precision && Math.abs(value - target) < precision;

  return { value: done ? target : value, velocity: done ? 0 : velocity, done };
}
export function createSpringState(value: number): SpringState {
  return { value, velocity: 0, done: false };
}
export function resolveSpringConfig(
  config?: Partial<SpringConfig> | SpringPreset,
): SpringConfig {
  if (config === undefined) return SPRING_PRESETS.default;
  if (typeof config === 'string') return SPRING_PRESETS[config];
  return { ...SPRING_PRESETS.default, ...config };
}
export type EasingFn = (t: number) => number;
export const EASINGS = {
  /** Linear interpolation (no easing). */
  linear: (t: number) => t,

  /** Quadratic ease-in (accelerating). */
  easeIn: (t: number) => t * t,
  /** Quadratic ease-out (decelerating). */
  easeOut: (t: number) => t * (2 - t),
  /** Quadratic ease-in-out (accelerate then decelerate). */
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  /** Cubic ease-in (accelerating). */
  easeInCubic: (t: number) => t * t * t,
  /** Cubic ease-out (decelerating). */
  easeOutCubic: (t: number) => --t * t * t + 1,
  /** Cubic ease-in-out (accelerate then decelerate). */
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  /** Quartic ease-in (accelerating). */
  easeInQuart: (t: number) => t * t * t * t,
  /** Quartic ease-out (decelerating). */
  easeOutQuart: (t: number) => 1 - --t * t * t * t,
  /** Quartic ease-in-out (accelerate then decelerate). */
  easeInOutQuart: (t: number) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
} as const satisfies Record<string, EasingFn>;
