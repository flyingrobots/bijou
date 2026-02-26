/**
 * Physics-based spring animation engine.
 *
 * Uses a damped harmonic oscillator model:
 *   F = -stiffness * displacement - damping * velocity
 *   acceleration = F / mass
 *
 * Inspired by react-spring and GSAP spring physics.
 */

// ---------------------------------------------------------------------------
// Spring configuration
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Spring state
// ---------------------------------------------------------------------------

export interface SpringState {
  /** Current animated value */
  readonly value: number;
  /** Current velocity */
  readonly velocity: number;
  /** Whether the spring has settled at the target */
  readonly done: boolean;
}

// ---------------------------------------------------------------------------
// Core simulation
// ---------------------------------------------------------------------------

/**
 * Advance a spring by one time step using semi-implicit Euler integration.
 *
 * @param state  Current spring state
 * @param target Target value the spring is approaching
 * @param config Spring physics parameters
 * @param dt     Time step in seconds (e.g. 1/60 for 60fps)
 */
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

/**
 * Create a fresh spring state at a given starting value.
 */
export function createSpringState(value: number): SpringState {
  return { value, velocity: 0, done: false };
}

/**
 * Resolve a preset name or config object to a full SpringConfig.
 */
export function resolveSpringConfig(
  config?: Partial<SpringConfig> | SpringPreset,
): SpringConfig {
  if (config === undefined) return SPRING_PRESETS.default;
  if (typeof config === 'string') return SPRING_PRESETS[config];
  return { ...SPRING_PRESETS.default, ...config };
}

// ---------------------------------------------------------------------------
// Easing functions (for tween-style animations)
// ---------------------------------------------------------------------------

export type EasingFn = (t: number) => number;

export const EASINGS = {
  linear: (t: number) => t,

  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - --t * t * t * t,
  easeInOutQuart: (t: number) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
} as const satisfies Record<string, EasingFn>;

// ---------------------------------------------------------------------------
// Tween state
// ---------------------------------------------------------------------------

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

/**
 * Advance a tween by a time step.
 *
 * @param state  Current tween state
 * @param config Tween parameters
 * @param dtMs   Time step in milliseconds
 */
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

/**
 * Create a fresh tween state.
 */
export function createTweenState(from: number): TweenState {
  return { value: from, elapsed: 0, done: false };
}

/**
 * Resolve partial tween config to full config with defaults.
 */
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
