/**
 * Forms module -- interactive CLI prompts (input, select, multiselect,
 * confirm, textarea, filter) and combinators (group, wizard).
 *
 * @module core/forms
 */

export type {
  ValidationResult,
  Validator,
  FieldOptions,
  SelectOption,
  SelectFieldOptions,
  ConfirmFieldOptions,
  GroupFieldResult,
} from './types.js';

export { input } from './input.js';
export type { InputOptions } from './input.js';

export { select } from './select.js';

export { multiselect } from './multiselect.js';

export { confirm } from './confirm.js';

export { group } from './group.js';

export { textarea } from './textarea.js';
export type { TextareaOptions } from './textarea.js';

export { filter } from './filter.js';
export type { FilterOption, FilterOptions } from './filter.js';

export { wizard } from './wizard.js';
export type { WizardStep, WizardOptions } from './wizard.js';
