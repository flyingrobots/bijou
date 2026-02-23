import * as readline from 'readline';
import chalk from 'chalk';
import { detectOutputMode } from '../detect/tty.js';
import { styled } from '../theme/chalk-adapter.js';
import { getTheme, isNoColor } from '../theme/resolve.js';
/**
 * Text input prompt.
 *
 * Degrades by output mode:
 * - interactive: Inline editing with validation feedback
 * - static/pipe: Readline prompt
 * - accessible: "Enter your X:" plain text
 */
export async function input(options) {
    const mode = detectOutputMode();
    const t = getTheme();
    const prompt = buildPrompt(options, mode);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            rl.close();
            const value = answer.trim() || options.defaultValue || '';
            if (options.required && value === '') {
                if (mode === 'accessible') {
                    process.stdout.write('This field is required.\n');
                }
                else if (!isNoColor()) {
                    process.stdout.write(styled(t.theme.semantic.error, 'This field is required.') + '\n');
                }
                else {
                    process.stdout.write('This field is required.\n');
                }
            }
            if (options.validate) {
                const result = options.validate(value);
                if (!result.valid && result.message) {
                    process.stdout.write((isNoColor() ? result.message : styled(t.theme.semantic.error, result.message)) + '\n');
                }
            }
            resolve(value);
        });
    });
}
function buildPrompt(options, mode) {
    const t = getTheme();
    const defaultHint = options.defaultValue ? ` (${options.defaultValue})` : '';
    switch (mode) {
        case 'accessible':
            return `Enter ${options.title.toLowerCase()}${defaultHint}: `;
        case 'pipe':
            return `${options.title}${defaultHint}: `;
        default: {
            if (isNoColor())
                return `${options.title}${defaultHint}: `;
            const label = styled(t.theme.semantic.info, '? ') + chalk.bold(options.title);
            const hint = options.defaultValue ? styled(t.theme.semantic.muted, ` (${options.defaultValue})`) : '';
            return `${label}${hint} `;
        }
    }
}
//# sourceMappingURL=input.js.map