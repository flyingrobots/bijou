import type { SelectFieldOptions } from './types.js';
/**
 * Single-select prompt.
 *
 * Degrades by output mode:
 * - interactive: Arrow-key navigation with highlight
 * - static/pipe: Numbered list, user enters number
 * - accessible: "Enter number:" prompt
 */
export declare function select<T = string>(options: SelectFieldOptions<T>): Promise<T>;
//# sourceMappingURL=select.d.ts.map