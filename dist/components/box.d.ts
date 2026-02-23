import { type Options as BoxenOptions } from 'boxen';
import type { TokenValue } from '../theme/tokens.js';
export interface BoxOptions {
    /** Border color token. Uses theme.border.primary if not specified. */
    borderToken?: TokenValue;
    /** boxen border style. Default: 'single'. */
    borderStyle?: BoxenOptions['borderStyle'];
    /** boxen padding. Default: { top: 0, bottom: 0, left: 1, right: 1 }. */
    padding?: BoxenOptions['padding'];
}
/**
 * Renders content inside a themed box.
 *
 * Degrades by output mode:
 * - interactive/static: Boxen with themed border
 * - pipe: Content only (no border)
 * - accessible: Content with header prefix
 */
export declare function box(content: string, options?: BoxOptions): string;
export interface HeaderBoxOptions extends BoxOptions {
    /** Detail text shown after the label (muted). */
    detail?: string;
    /** Label token override. Uses theme.semantic.primary if not specified. */
    labelToken?: TokenValue;
}
/**
 * Renders a header box with a styled label and optional detail text.
 *
 * Degrades by output mode:
 * - interactive/static: Boxen with styled label + muted detail
 * - pipe: "label  detail"
 * - accessible: "label: detail"
 */
export declare function headerBox(label: string, options?: HeaderBoxOptions): string;
//# sourceMappingURL=box.d.ts.map