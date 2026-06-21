export {
  preferenceListSurface,
  preferenceRowSurface,
  resolvePreferenceRowLayout,
  preparePreferenceRow,
  preparePreferenceSections,
} from './core/components/preference-list.js';

export type {
  PreferenceListTheme,
  PreferenceRowKind,
  PreferenceRow,
  PreparedPreferenceRow,
  PreferenceSection,
  PreparedPreferenceSection,
  PreferenceRowLayout,
  PreferenceRowSurfaceOptions,
  PreferenceListSurfaceOptions,
} from './core/components/preference-list.js';

// Shared ANSI escape constants
export { HIDE_CURSOR, SHOW_CURSOR, CLEAR_LINE_RETURN } from './core/ansi.js';

// Rendering
export { renderDiff, isSameCell, stringToSurface, parseAnsiToSurface, surfaceToString, paintLayoutNode } from './core/render/differ.js';

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
