/**
 * Result of a field validation check.
 */
export interface ValidationResult {
  /** Whether the value passed validation. */
  valid: boolean;
  /** Human-readable error message when validation fails. */
  message?: string;
}

/**
 * Validate a field value and return a {@link ValidationResult}.
 *
 * @typeParam T - Type of the value being validated.
 */
export type Validator<T> = (value: T) => ValidationResult;

/**
 * Base options shared by all form field types.
 *
 * @typeParam T - Type of the field's value.
 */
export interface FieldOptions<T> {
  /** Prompt title shown to the user. */
  title: string;
  /** Default value returned when the user provides no input. */
  defaultValue?: T;
  /** Whether the field is required. Default: false. */
  required?: boolean;
  /** Validation function applied to the field value after input. */
  validate?: Validator<T>;
}

/**
 * Single selectable option used in select and multiselect fields.
 *
 * @typeParam T - Type of the option's value.
 */
export interface SelectOption<T = string> {
  /** Display label shown in the option list. */
  label: string;
  /** Value returned when this option is selected. */
  value: T;
  /** Optional description displayed beside the label. */
  description?: string;
}

/**
 * Options for select-style fields that present a list of choices.
 *
 * @typeParam T - Type of each option's value.
 */
export interface SelectFieldOptions<T = string> extends FieldOptions<T> {
  /** List of selectable options. */
  options: SelectOption<T>[];
}

/**
 * Options for a yes/no confirmation field.
 */
export interface ConfirmFieldOptions extends FieldOptions<boolean> {
  /** Which option is the default. Default: true (yes). */
  defaultValue?: boolean;
}

/**
 * Result returned by {@link group} and {@link wizard} form combinators.
 *
 * @typeParam T - Record type mapping field keys to their collected values.
 */
export interface GroupFieldResult<T extends Record<string, unknown>> {
  /** Collected values keyed by field name. */
  values: T;
  /** Whether the user cancelled the form before completion. */
  cancelled: boolean;
}
