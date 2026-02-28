/**
 * @module @flyingrobots/bijou
 *
 * Themed terminal components for CLIs, loggers, and scripts —
 * with graceful degradation across output modes.
 */

// Port interfaces
export type {
  RuntimePort,
  IOPort,
  RawInputHandle,
  TimerHandle,
  StylePort,
  BijouContext,
} from './ports/index.js';

// Context
export {
  getDefaultContext,
  setDefaultContext,
  _resetDefaultContextForTesting,
} from './context.js';

// Context resolution helpers
export { resolveCtx, resolveSafeCtx } from './core/resolve-ctx.js';

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
  getTheme,
  resolveTheme,
  _resetThemeForTesting,
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
  // Color manipulation
  hexToRgb,
  rgbToHex,
  lighten,
  darken,
  mix,
  complementary,
  saturate,
  desaturate,
} from './core/theme/index.js';

// Text / grapheme utilities
export {
  isWideChar,
  segmentGraphemes,
  graphemeClusterWidth,
  graphemeWidth,
  clipToWidth,
} from './core/text/index.js';

// Detection
export { detectOutputMode, type OutputMode } from './core/detect/index.js';

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
} from './core/components/index.js';

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
} from './core/forms/index.js';
