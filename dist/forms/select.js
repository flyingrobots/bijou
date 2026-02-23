import * as readline from 'readline';
import chalk from 'chalk';
import { detectOutputMode } from '../detect/tty.js';
import { styled } from '../theme/chalk-adapter.js';
import { getTheme, isNoColor } from '../theme/resolve.js';
/**
 * Single-select prompt.
 *
 * Degrades by output mode:
 * - interactive: Arrow-key navigation with highlight
 * - static/pipe: Numbered list, user enters number
 * - accessible: "Enter number:" prompt
 */
export async function select(options) {
    const mode = detectOutputMode();
    if (mode === 'interactive' && process.stdin.isTTY) {
        return interactiveSelect(options);
    }
    return numberedSelect(options, mode);
}
async function numberedSelect(options, mode) {
    const t = getTheme();
    const noColor = isNoColor();
    // Print title
    if (mode === 'accessible') {
        process.stdout.write(`${options.title}\n`);
    }
    else if (noColor) {
        process.stdout.write(`${options.title}\n`);
    }
    else {
        process.stdout.write(styled(t.theme.semantic.info, '? ') + chalk.bold(options.title) + '\n');
    }
    // Print numbered options
    for (let i = 0; i < options.options.length; i++) {
        const opt = options.options[i];
        const num = `  ${i + 1}.`;
        const desc = opt.description ? ` — ${opt.description}` : '';
        if (mode === 'accessible') {
            process.stdout.write(`${num} ${opt.label}${desc}\n`);
        }
        else {
            process.stdout.write(`${num} ${opt.label}${desc}\n`);
        }
    }
    const prompt = mode === 'accessible' ? 'Enter number: ' : '> ';
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            rl.close();
            const idx = parseInt(answer.trim(), 10) - 1;
            if (idx >= 0 && idx < options.options.length) {
                resolve(options.options[idx].value);
            }
            else {
                // Fall back to first option or default
                const fallback = options.defaultValue ?? options.options[0].value;
                resolve(fallback);
            }
        });
    });
}
async function interactiveSelect(options) {
    const t = getTheme();
    const noColor = isNoColor();
    let cursor = 0;
    function render() {
        // Move cursor up to overwrite previous render
        const label = noColor
            ? `? ${options.title}`
            : styled(t.theme.semantic.info, '? ') + chalk.bold(options.title);
        process.stdout.write(`\x1b[?25l`); // hide cursor
        process.stdout.write(`\r\x1b[K${label}\n`);
        for (let i = 0; i < options.options.length; i++) {
            const opt = options.options[i];
            const isCurrent = i === cursor;
            const prefix = isCurrent ? '❯' : ' ';
            const desc = opt.description ? styled(t.theme.semantic.muted, ` — ${opt.description}`) : '';
            if (isCurrent && !noColor) {
                process.stdout.write(`\x1b[K  ${styled(t.theme.semantic.info, prefix)} ${chalk.bold(opt.label)}${desc}\n`);
            }
            else {
                process.stdout.write(`\x1b[K  ${prefix} ${opt.label}${desc}\n`);
            }
        }
    }
    function clearRender() {
        // Move up by options.length + 1 (title line + options)
        const totalLines = options.options.length + 1;
        process.stdout.write(`\x1b[${totalLines}A`);
    }
    render();
    return new Promise((resolve) => {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        const onData = (data) => {
            const key = data.toString();
            if (key === '\x1b[A' || key === 'k') {
                // Up
                cursor = (cursor - 1 + options.options.length) % options.options.length;
                clearRender();
                render();
            }
            else if (key === '\x1b[B' || key === 'j') {
                // Down
                cursor = (cursor + 1) % options.options.length;
                clearRender();
                render();
            }
            else if (key === '\r' || key === '\n') {
                // Enter — select
                cleanup();
                resolve(options.options[cursor].value);
            }
            else if (key === '\x03') {
                // Ctrl+C
                cleanup();
                resolve(options.defaultValue ?? options.options[0].value);
            }
        };
        function cleanup() {
            process.stdin.removeListener('data', onData);
            process.stdin.setRawMode(false);
            process.stdin.pause();
            // Clear the rendered UI
            clearRender();
            const totalLines = options.options.length + 1;
            for (let i = 0; i < totalLines; i++) {
                process.stdout.write(`\x1b[K\n`);
            }
            process.stdout.write(`\x1b[${totalLines}A`);
            // Show final selection
            const selected = options.options[cursor];
            const label = noColor
                ? `? ${options.title} ${selected.label}`
                : styled(t.theme.semantic.info, '? ') + chalk.bold(options.title) + ' ' + styled(t.theme.semantic.info, selected.label);
            process.stdout.write(`\x1b[K${label}\n`);
            process.stdout.write(`\x1b[?25h`); // show cursor
        }
        process.stdin.on('data', onData);
    });
}
//# sourceMappingURL=select.js.map