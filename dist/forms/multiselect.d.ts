import type { SelectFieldOptions } from './types.js';
/**
 * Multi-select prompt. Returns an array of selected values.
 *
 * Degrades by output mode:
 * - interactive: Arrow-key navigation, space to toggle, enter to confirm
 * - static/pipe: Numbered list, user enters comma-separated numbers
 * - accessible: "Enter numbers separated by commas:"
 */
export declare function multiselect<T = string>(options: SelectFieldOptions<T>): Promise<T[]>;
//# sourceMappingURL=multiselect.d.ts.map