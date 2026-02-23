import { detectOutputMode } from '../detect/tty.js';
const DOTS = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
/**
 * Returns the spinner frame string for a given tick index.
 * Degrades by output mode:
 * - interactive: animated frame
 * - static: "... label"
 * - pipe: "label..."
 * - accessible: "label. Please wait."
 */
export function spinnerFrame(tick, options = {}) {
    const frames = options.frames ?? DOTS;
    const label = options.label ?? 'Loading';
    const mode = detectOutputMode();
    switch (mode) {
        case 'interactive': {
            const frame = frames[tick % frames.length] ?? frames[0] ?? '⠋';
            return `${frame} ${label}`;
        }
        case 'static':
            return `... ${label}`;
        case 'pipe':
            return `${label}...`;
        case 'accessible':
            return `${label}. Please wait.`;
    }
}
/**
 * Creates an animated spinner that writes directly to process.stdout.
 * In non-interactive modes, prints a single static line instead.
 */
export function createSpinner(options = {}) {
    const frames = options.frames ?? DOTS;
    const interval = options.interval ?? 80;
    let label = options.label ?? 'Loading';
    let timer = null;
    let tick = 0;
    const mode = detectOutputMode();
    function render() {
        const line = spinnerFrame(tick, { frames, label });
        process.stdout.write(`\r\x1b[K${line}`);
        tick++;
    }
    return {
        start() {
            if (mode !== 'interactive') {
                process.stdout.write(spinnerFrame(0, { frames, label }) + '\n');
                return;
            }
            process.stdout.write('\x1b[?25l'); // hide cursor
            render();
            timer = setInterval(render, interval);
        },
        update(newLabel) {
            label = newLabel;
        },
        stop(finalMessage) {
            if (timer !== null) {
                clearInterval(timer);
                timer = null;
            }
            if (mode === 'interactive') {
                process.stdout.write('\r\x1b[K'); // clear line
                process.stdout.write('\x1b[?25h'); // show cursor
            }
            if (finalMessage !== undefined) {
                process.stdout.write(finalMessage + '\n');
            }
        },
    };
}
//# sourceMappingURL=spinner.js.map