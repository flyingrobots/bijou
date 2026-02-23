import * as readline from 'readline';
import chalk from 'chalk';
import { detectOutputMode } from '../detect/tty.js';
import { styled } from '../theme/chalk-adapter.js';
import { getTheme, isNoColor } from '../theme/resolve.js';
/**
 * Yes/no confirmation prompt.
 *
 * Degrades by output mode:
 * - interactive/static: "[Y/n]" or "[y/N]" styled prompt
 * - pipe: "Y/n?" or "y/N?"
 * - accessible: "Type yes or no:"
 */
export async function confirm(options) {
    const mode = detectOutputMode();
    const t = getTheme();
    const noColor = isNoColor();
    const defaultYes = options.defaultValue !== false;
    let prompt;
    const hint = defaultYes ? 'Y/n' : 'y/N';
    switch (mode) {
        case 'accessible':
            prompt = `${options.title} Type yes or no (default: ${defaultYes ? 'yes' : 'no'}): `;
            break;
        case 'pipe':
            prompt = `${options.title} ${hint}? `;
            break;
        default:
            if (noColor) {
                prompt = `${options.title} [${hint}] `;
            }
            else {
                prompt = styled(t.theme.semantic.info, '? ') + chalk.bold(options.title) + styled(t.theme.semantic.muted, ` [${hint}]`) + ' ';
            }
            break;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            rl.close();
            const trimmed = answer.trim().toLowerCase();
            if (trimmed === '') {
                resolve(defaultYes);
            }
            else if (trimmed === 'y' || trimmed === 'yes') {
                resolve(true);
            }
            else if (trimmed === 'n' || trimmed === 'no') {
                resolve(false);
            }
            else {
                resolve(defaultYes);
            }
        });
    });
}
//# sourceMappingURL=confirm.js.map