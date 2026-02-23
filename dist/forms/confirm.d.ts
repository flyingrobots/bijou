import type { ConfirmFieldOptions } from './types.js';
/**
 * Yes/no confirmation prompt.
 *
 * Degrades by output mode:
 * - interactive/static: "[Y/n]" or "[y/N]" styled prompt
 * - pipe: "Y/n?" or "y/N?"
 * - accessible: "Type yes or no:"
 */
export declare function confirm(options: ConfirmFieldOptions): Promise<boolean>;
//# sourceMappingURL=confirm.d.ts.map