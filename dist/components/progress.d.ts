import type { GradientStop } from '../theme/tokens.js';
export interface ProgressBarOptions {
    /** Bar width in characters. Default: 20. */
    width?: number;
    /** Filled character. Default: '█'. */
    filled?: string;
    /** Empty character. Default: '░'. */
    empty?: string;
    /** Gradient stops for coloring. Uses theme.gradient.progress if not specified. */
    gradient?: GradientStop[];
    /** Show percentage label. Default: true. */
    showPercent?: boolean;
}
/**
 * Renders a progress bar string.
 *
 * Degrades by output mode:
 * - interactive/static: `[████░░░░] 45%` (colored in interactive)
 * - pipe: "Progress: 45%"
 * - accessible: "45 percent complete."
 */
export declare function progressBar(percent: number, options?: ProgressBarOptions): string;
//# sourceMappingURL=progress.d.ts.map