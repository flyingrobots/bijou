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

/** Physics parameters for a damped harmonic oscillator spring. */
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

/**
 * Built-in spring presets covering common motion styles.
 *
 * Use a preset name (e.g. `'wobbly'`) anywhere a {@link SpringConfig}
 * or {@link SpringPreset} is accepted.
 */
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

/** Name of a built-in spring preset from {@link SPRING_PRESETS}. */
export type SpringPreset = keyof typeof SPRING_PRESETS;

// ---------------------------------------------------------------------------
// Spring state
// ---------------------------------------------------------------------------

/** Snapshot of a running spring animation at a single point in time. */
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
 * @param state  - Current spring state.
 * @param target - Target value the spring is approaching.
 * @param config - Spring physics parameters.
 * @param dt     - Time step in seconds (e.g. 1/60 for 60fps).
 * @returns A new spring state with updated value, velocity, and done flag.
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
 *
 * @param value - The initial position of the spring.
 * @returns A spring state with zero velocity and `done` set to false.
 */
export function createSpringState(value: number): SpringState {
  return { value, velocity: 0, done: false };
}

/**
 * Resolve a preset name or config object to a full SpringConfig.
 *
 * @param config - A preset name, partial config, or undefined for the default.
 * @returns A complete {@link SpringConfig} with all fields populated.
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

/**
 * An easing function that maps a normalized progress `t` (0..1) to a
 * transformed value, controlling the acceleration curve of a tween.
 *
 * @param t - Normalized time in the range [0, 1].
 * @returns The eased value.
 */
export type EasingFn = (t: number) => number;

/**
 * Built-in easing functions for tween-style animations.
 *
 * Each function accepts a normalized time `t` in [0, 1] and returns
 * the eased value. Quadratic, cubic, and quartic variants are provided
 * in ease-in, ease-out, and ease-in-out forms.
 */
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

// ---------------------------------------------------------------------------
// Tween state
// ---------------------------------------------------------------------------

/** Configuration for a duration-based tween animation. */
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

/** Mutable snapshot of a running tween animation. */
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
 * @param state  - Current tween state.
 * @param config - Tween parameters (from, to, duration, ease).
 * @param dtMs   - Time step in milliseconds.
 * @returns A new tween state with updated value, elapsed time, and done flag.
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
 *
 * @param from - The starting value of the tween.
 * @returns A tween state with zero elapsed time and `done` set to false.
 */
export function createTweenState(from: number): TweenState {
  return { value: from, elapsed: 0, done: false };
}

/**
 * Resolve partial tween config to full config with defaults.
 *
 * @param config - Partial tween config; `duration` is required, others default.
 * @returns A complete {@link TweenConfig} with all fields populated.
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
