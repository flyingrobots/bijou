import type { TokenValue } from '../theme/tokens.js';
export interface TableColumn {
    /** Column header text. */
    header: string;
    /** Fixed column width. Optional — auto-sized if omitted. */
    width?: number;
}
export interface TableOptions {
    /** Column definitions. */
    columns: TableColumn[];
    /** Row data — each row is an array of strings matching columns. */
    rows: string[][];
    /** Header token override. Uses theme.ui.tableHeader if not specified. */
    headerToken?: TokenValue;
    /** Border token override. Uses theme.border.muted if not specified. */
    borderToken?: TokenValue;
}
/**
 * Renders a themed table string.
 *
 * Degrades by output mode:
 * - interactive/static: Themed cli-table3 with borders + colors
 * - pipe: Tab-separated values
 * - accessible: "Row N: Header=value, Header=value"
 */
export declare function table(options: TableOptions): string;
//# sourceMappingURL=table.d.ts.map