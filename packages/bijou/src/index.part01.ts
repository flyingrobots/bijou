/**
 * @module @flyingrobots/bijou
 *
 * Themed terminal components for CLIs, loggers, and scripts —
 * with graceful degradation across output modes.
 */

// Port interfaces
export type {
  RuntimePort,
  WritePort,
  QueryPort,
  InteractivePort,
  FilePort,
  IOPort,
  ClockPort,
  RawInputHandle,
  TimerHandle,
  KeyInputMsg,
  StylePort,
  BijouContext,
} from './ports/index.js';

export {
  type Cell,
  type Surface,
  type PackedSurface,
  type CellMask,
  type Matrix3x3,
  type TransformOptions,
  createSurface,
  isPackedSurface,
  FULL_MASK,
  ROTATION_CHAR_MAP,
} from './ports/surface.js';

export {
  FLAG_BOLD,
  FLAG_DIM,
  FLAG_STRIKETHROUGH,
  FLAG_INVERSE,
  FLAG_EMPTY,
  UNDERLINE_SOLID,
  UNDERLINE_CURLY,
  UNDERLINE_DOTDASH,
  FLAG_DASHED,
} from './core/render/packed-cell.js';

// Context
export {
  getDefaultContext,
  setDefaultContext,
  setDefaultContextInitializer,
} from './context.js';

export {
  cloneContextWithResolvedTheme,
  cloneContextWithTheme,
  observeTheme,
  type ThemeChange,
  type ThemeObservation,
} from './context-theme.js';

// Context resolution helpers
export { resolveCtx, resolveSafeCtx } from './core/resolve-ctx.js';

export { systemClock, resolveClock, sleep, defer } from './core/clock.js';

export { decodeRawKeyInput, decodeRawKeySequence } from './core/key-input.js';

export {
  type RuntimeViewport,
  sanitizeRuntimeDimension,
  readRuntimeViewport,
  installRuntimeViewportOverlay,
  updateRuntimeViewport,
} from './core/runtime-viewport.js';

export {
  sanitizeNonNegativeInt,
  sanitizeOptionalNonNegativeInt,
  sanitizeOptionalPositiveInt,
  sanitizePositiveInt,
} from './core/numeric.js';

export {
  solveGridRects,
  solveSplitAxisSizes,
  solveSplitPaneRects,
  type GridTrack,
  type SplitAxisOptions,
  type SplitAxisSizes,
  type SplitLayoutDirection,
  type SplitPaneRectOptions,
  type SplitPaneRects,
  type GridRectOptions,
} from './core/layout/geometry.js';
