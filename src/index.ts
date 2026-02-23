// Theme engine
export {
  // Types
  type RGB,
  type GradientStop,
  type TextModifier,
  type TokenValue,
  type InkColor,
  type BaseStatusKey,
  type Theme,
  // Presets
  CYAN_MAGENTA,
  TEAL_ORANGE_PINK,
  PRESETS,
  // Gradient
  lerp3,
  gradientText,
  // Resolver
  isNoColor,
  getTheme,
  resolveTheme,
  _resetThemeForTesting,
  createThemeResolver,
  type ResolvedTheme,
  type ThemeResolver,
  type ThemeResolverOptions,
  // Chalk adapter
  chalkFromToken,
  styled,
  styledStatus,
} from './theme/index.js';

// Detection
export { detectOutputMode, type OutputMode } from './detect/index.js';

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
} from './components/index.js';

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
} from './forms/index.js';
