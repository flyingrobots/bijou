import type { FieldOptions } from './types.js';
export interface InputOptions extends FieldOptions<string> {
    /** Placeholder text shown when empty (interactive only). */
    placeholder?: string;
}
/**
 * Text input prompt.
 *
 * Degrades by output mode:
 * - interactive: Inline editing with validation feedback
 * - static/pipe: Readline prompt
 * - accessible: "Enter your X:" plain text
 */
export declare function input(options: InputOptions): Promise<string>;
//# sourceMappingURL=input.d.ts.map