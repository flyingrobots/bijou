export interface ValidationResult {
    valid: boolean;
    message?: string;
}
export type Validator<T> = (value: T) => ValidationResult;
export interface FieldOptions<T> {
    /** Prompt title shown to the user. */
    title: string;
    /** Default value. */
    defaultValue?: T;
    /** Whether the field is required. Default: false. */
    required?: boolean;
    /** Validation function. */
    validate?: Validator<T>;
}
export interface SelectOption<T = string> {
    label: string;
    value: T;
    description?: string;
}
export interface SelectFieldOptions<T = string> extends FieldOptions<T> {
    options: SelectOption<T>[];
}
export interface ConfirmFieldOptions extends FieldOptions<boolean> {
    /** Which option is the default. Default: true (yes). */
    defaultValue?: boolean;
}
export interface GroupFieldResult<T extends Record<string, unknown>> {
    values: T;
    cancelled: boolean;
}
//# sourceMappingURL=types.d.ts.map