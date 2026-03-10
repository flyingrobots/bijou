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
  RawInputHandle,
  TimerHandle,
  StylePort,
  BijouContext,
} from './ports/index.js';

export {
  type Cell,
  type Surface,
  type CellMask,
  type Matrix3x3,
  type TransformOptions,
  createSurface,
  FULL_MASK,
  ROTATION_CHAR_MAP,
} from './ports/surface.js';

// Context
export {
  getDefaultContext,
  setDefaultContext,
} from './context.js';

// Context resolution helpers
export { resolveCtx, resolveSafeCtx } from './core/resolve-ctx.js';

// Mode rendering strategy
export {
  renderByMode,
  type ModeHandler,
  type ModeMap,
} from './core/mode-render.js';

// Background fill utilities
export { shouldApplyBg, makeBgFill } from './core/bg-fill.js';

// Factory
export { createBijou, type CreateBijouOptions } from './factory.js';

// Theme engine
export {
  // Types
  type RGB,
  type GradientStop,
  type TextModifier,
  type TokenValue,
  type InkColor,
  type BaseStatusKey,
  type BaseUiKey,
  type BaseGradientKey,
  type Theme,
  // Presets
  CYAN_MAGENTA,
  TEAL_ORANGE_PINK,
  PRESETS,
  tv,
  // Freestanding styled helpers
  styled,
  styledStatus,
  // Theme extension
  extendTheme,
  // Gradient
  lerp3,
  gradientText,
  // Gradient options
  type GradientTextOptions,
  // Resolver
  isNoColor,
  createThemeResolver,
  createResolved,
  type ResolvedTheme,
  type ThemeResolver,
  type ThemeResolverOptions,
  // DTCG interop
  fromDTCG,
  toDTCG,
  type DTCGDocument,
  type DTCGToken,
  type DTCGGroup,
  // Color downsampling
  rgbToAnsi256,
  nearestAnsi256,
  rgbToAnsi16,
  ansi256ToAnsi16,
  type ColorLevel,
  // Theme accessors
  createThemeAccessors,
  type ThemeAccessors,
  // Color manipulation
  hexToRgb,
  rgbToHex,
  lighten,
  darken,
  mix,
  complementary,
  saturate,
  desaturate,
  // Reactive Token Graph
  createTokenGraph,
  type TokenGraph,
  type ThemeMode,
  type ColorDefinition,
  type TokenDefinition,
  type TokenDefinitions,
  type ColorTransform,
} from './core/theme/index.js';

// Text / grapheme utilities
export {
  isWideChar,
  segmentGraphemes,
  graphemeClusterWidth,
  graphemeWidth,
  clipToWidth,
  ANSI_SGR_RE,
  stripAnsi,
} from './core/text/index.js';

// Detection
export {
  detectOutputMode,
  detectColorScheme,
  type OutputMode,
  type ColorScheme,
} from './core/detect/index.js';

// Components
export {
  spinnerFrame,
  createSpinner,
  type SpinnerOptions,
  type SpinnerController,
  progressBar,
  createProgressBar,
  createAnimatedProgressBar,
  type ProgressBarOptions,
  type LiveProgressBarOptions,
  type AnimatedProgressBarOptions,
  type ProgressBarController,
  table,
  type TableColumn,
  type TableOptions,
  box,
  headerBox,
  type BoxOptions,
  type HeaderBoxOptions,
  selectLogoSize,
  loadRandomLogo,
  type LogoSize,
  type LogoResult,
  type LogoConstraints,
  type LogoOptions,
  separator,
  type SeparatorOptions,
  badge,
  type BadgeVariant,
  type BadgeOptions,
  alert,
  type AlertVariant,
  type AlertOptions,
  skeleton,
  type SkeletonOptions,
  kbd,
  type KbdOptions,
  tree,
  type TreeNode,
  type TreeOptions,
  accordion,
  type AccordionSection,
  type AccordionOptions,
  timeline,
  type TimelineEvent,
  type TimelineOptions,
  tabs,
  type TabItem,
  type TabsOptions,
  breadcrumb,
  type BreadcrumbOptions,
  paginator,
  type PaginatorOptions,
  stepper,
  type StepperStep,
  type StepperOptions,
  dag,
  dagSlice,
  dagLayout,
  type DagNode,
  type DagOptions,
  type DagNodePosition,
  type DagLayout,
  arraySource,
  isDagSource,
  isSlicedDagSource,
  type DagSource,
  type SlicedDagSource,
  type DagSliceOptions,
  dagStats,
  type DagStats,
  enumeratedList,
  type BulletStyle,
  type EnumeratedListOptions,
  hyperlink,
  type HyperlinkOptions,
  log,
  type LogLevel,
  type LogOptions,
  markdown,
  type MarkdownOptions,
  constrain,
  type ConstrainOptions,
  timer,
  createTimer,
  createStopwatch,
  type TimerOptions,
  type TimerController,
  type CreateTimerOptions,
  type CreateStopwatchOptions,
  cursorGuard,
  withHiddenCursor,
  type CursorGuard,
  type CursorHideHandle,
} from './core/components/index.js';

// Shared ANSI escape constants
export { HIDE_CURSOR, SHOW_CURSOR, CLEAR_LINE_RETURN } from './core/ansi.js';

// Rendering
export { renderDiff, isSameCell, stringToSurface, surfaceToString, paintLayoutNode } from './core/render/differ.js';

// Layout
export type { LayoutRect, LayoutNode, LayoutEngine } from './ports/surface.js';
export { calculateFlex, type FlexOptions, type FlexChildProps } from './core/layout/flex.js';

// Forms
export {
  type ValidationResult,
  type Validator,
  type FieldOptions,
  type SelectOption,
  type SelectFieldOptions,
  type ConfirmFieldOptions,
  type GroupFieldResult,
  type InputOptions,
  input,
  select,
  multiselect,
  confirm,
  group,
  textarea,
  type TextareaOptions,
  filter,
  type FilterOption,
  type FilterOptions,
  wizard,
  type WizardStep,
  type WizardOptions,
  note,
  type NoteOptions,
} from './core/forms/index.js';
export { boxV3 } from './core/components/box-v3.js';
export { parseAnsiToSurface } from './core/render/differ.js';
