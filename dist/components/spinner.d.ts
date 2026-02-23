export interface SpinnerOptions {
    /** Spinner frame set. Default: dots ('⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'). */
    frames?: string[];
    /** Label shown next to the spinner. */
    label?: string;
    /** Frame interval in ms. Default: 80. */
    interval?: number;
}
/**
 * Returns the spinner frame string for a given tick index.
 * Degrades by output mode:
 * - interactive: animated frame
 * - static: "... label"
 * - pipe: "label..."
 * - accessible: "label. Please wait."
 */
export declare function spinnerFrame(tick: number, options?: SpinnerOptions): string;
export interface SpinnerController {
    /** Start the spinner. Writes to stdout. */
    start(): void;
    /** Update the label while spinning. */
    update(label: string): void;
    /** Stop and clear the spinner line. Optionally print a final message. */
    stop(finalMessage?: string): void;
}
/**
 * Creates an animated spinner that writes directly to process.stdout.
 * In non-interactive modes, prints a single static line instead.
 */
export declare function createSpinner(options?: SpinnerOptions): SpinnerController;
//# sourceMappingURL=spinner.d.ts.map