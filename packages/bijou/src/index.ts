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
} from './context.js';

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
} from './core/theme/index.js';

// Detection
export { detectOutputMode, type OutputMode } from './core/detect/index.js';

// Components
export {
  spinnerFrame,
  createSpinner,
  type SpinnerOptions,
  type SpinnerController,
  progressBar,
  type ProgressBarOptions,
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
} from './core/forms/index.js';
