import * as readline from 'readline';
import chalk from 'chalk';
import { detectOutputMode, type OutputMode } from '../detect/tty.js';
import { styled } from '../theme/chalk-adapter.js';
import { getTheme, isNoColor } from '../theme/resolve.js';
import type { SelectFieldOptions } from './types.js';

/**
 * Multi-select prompt. Returns an array of selected values.
 *
 * Degrades by output mode:
 * - interactive: Arrow-key navigation, space to toggle, enter to confirm
 * - static/pipe: Numbered list, user enters comma-separated numbers
 * - accessible: "Enter numbers separated by commas:"
 */
export async function multiselect<T = string>(options: SelectFieldOptions<T>): Promise<T[]> {
  const mode = detectOutputMode();

  if (mode === 'interactive' && process.stdin.isTTY) {
    return interactiveMultiselect(options);
  }

  return numberedMultiselect(options, mode);
}

async function numberedMultiselect<T>(options: SelectFieldOptions<T>, mode: OutputMode): Promise<T[]> {
  const t = getTheme();
  const noColor = isNoColor();

  if (mode === 'accessible') {
    process.stdout.write(`${options.title}\n`);
  } else if (noColor) {
    process.stdout.write(`${options.title}\n`);
  } else {
    process.stdout.write(styled(t.theme.semantic.info, '? ') + chalk.bold(options.title) + '\n');
  }

  for (let i = 0; i < options.options.length; i++) {
    const opt = options.options[i]!;
    const desc = opt.description ? ` — ${opt.description}` : '';
    process.stdout.write(`  ${i + 1}. ${opt.label}${desc}\n`);
  }

  const prompt = mode === 'accessible'
    ? 'Enter numbers separated by commas: '
    : 'Enter numbers (comma-separated): ';

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  return new Promise<T[]>((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      const indices = answer.split(',')
        .map((s) => parseInt(s.trim(), 10) - 1)
        .filter((i) => i >= 0 && i < options.options.length);
      resolve(indices.map((i) => options.options[i]!.value));
    });
  });
}

async function interactiveMultiselect<T>(options: SelectFieldOptions<T>): Promise<T[]> {
  const t = getTheme();
  const noColor = isNoColor();
  let cursor = 0;
  const selected = new Set<number>();

  function render(): void {
    const label = noColor
      ? `? ${options.title}`
      : styled(t.theme.semantic.info, '? ') + chalk.bold(options.title);
    process.stdout.write(`\x1b[?25l`);
    process.stdout.write(`\r\x1b[K${label}  ${styled(t.theme.semantic.muted, '(space to toggle, enter to confirm)')}\n`);

    for (let i = 0; i < options.options.length; i++) {
      const opt = options.options[i]!;
      const isCurrent = i === cursor;
      const isSelected = selected.has(i);
      const prefix = isCurrent ? '❯' : ' ';
      const check = isSelected ? '◉' : '○';
      const desc = opt.description ? styled(t.theme.semantic.muted, ` — ${opt.description}`) : '';
      if (isCurrent && !noColor) {
        process.stdout.write(`\x1b[K  ${styled(t.theme.semantic.info, prefix)} ${styled(t.theme.semantic.info, check)} ${chalk.bold(opt.label)}${desc}\n`);
      } else if (isSelected && !noColor) {
        process.stdout.write(`\x1b[K  ${prefix} ${styled(t.theme.semantic.success, check)} ${opt.label}${desc}\n`);
      } else {
        process.stdout.write(`\x1b[K  ${prefix} ${check} ${opt.label}${desc}\n`);
      }
    }
  }

  function clearRender(): void {
    const totalLines = options.options.length + 1;
    process.stdout.write(`\x1b[${totalLines}A`);
  }

  render();

  return new Promise<T[]>((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const onData = (data: Buffer): void => {
      const key = data.toString();

      if (key === '\x1b[A' || key === 'k') {
        cursor = (cursor - 1 + options.options.length) % options.options.length;
        clearRender();
        render();
      } else if (key === '\x1b[B' || key === 'j') {
        cursor = (cursor + 1) % options.options.length;
        clearRender();
        render();
      } else if (key === ' ') {
        if (selected.has(cursor)) {
          selected.delete(cursor);
        } else {
          selected.add(cursor);
        }
        clearRender();
        render();
      } else if (key === '\r' || key === '\n') {
        cleanup();
        const values = [...selected].sort().map((i) => options.options[i]!.value);
        resolve(values);
      } else if (key === '\x03') {
        cleanup();
        resolve([]);
      }
    };

    function cleanup(): void {
      process.stdin.removeListener('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      clearRender();
      const totalLines = options.options.length + 1;
      for (let i = 0; i < totalLines; i++) {
        process.stdout.write(`\x1b[K\n`);
      }
      process.stdout.write(`\x1b[${totalLines}A`);
      const selectedLabels = [...selected].sort().map((i) => options.options[i]!.label).join(', ');
      const label = noColor
        ? `? ${options.title} ${selectedLabels}`
        : styled(t.theme.semantic.info, '? ') + chalk.bold(options.title) + ' ' + styled(t.theme.semantic.info, selectedLabels);
      process.stdout.write(`\x1b[K${label}\n`);
      process.stdout.write(`\x1b[?25h`);
    }

    process.stdin.on('data', onData);
  });
}
