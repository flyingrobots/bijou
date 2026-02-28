import type { SelectFieldOptions } from './types.js';
import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import type { OutputMode } from '../detect/tty.js';
import { getDefaultContext } from '../../context.js';

export interface MultiselectOptions<T = string> extends SelectFieldOptions<T> {
  ctx?: BijouContext;
}

export async function multiselect<T = string>(options: MultiselectOptions<T>): Promise<T[]> {
  const ctx = options.ctx ?? getDefaultContext();
  const mode = ctx.mode;

  if (mode === 'interactive' && ctx.runtime.stdinIsTTY) {
    return interactiveMultiselect(options, ctx);
  }

  return numberedMultiselect(options, mode, ctx);
}

async function numberedMultiselect<T>(options: MultiselectOptions<T>, mode: OutputMode, ctx: BijouContext): Promise<T[]> {
  const noColor = ctx.theme.noColor;
  const styledFn = (token: TokenValue, text: string) => ctx.style.styled(token, text);

  if (noColor || mode === 'accessible') {
    ctx.io.write(`${options.title}\n`);
  } else {
    ctx.io.write(styledFn(ctx.theme.theme.semantic.info, '? ') + ctx.style.bold(options.title) + '\n');
  }

  for (let i = 0; i < options.options.length; i++) {
    const opt = options.options[i]!;
    const desc = opt.description ? ` \u2014 ${opt.description}` : '';
    ctx.io.write(`  ${i + 1}. ${opt.label}${desc}\n`);
  }

  const prompt = mode === 'accessible'
    ? 'Enter numbers separated by commas: '
    : 'Enter numbers (comma-separated): ';

  const answer = await ctx.io.question(prompt);
  const indices = answer.split(',')
    .map((s) => parseInt(s.trim(), 10) - 1)
    .filter((i) => i >= 0 && i < options.options.length);
  return indices.map((i) => options.options[i]!.value);
}

async function interactiveMultiselect<T>(options: MultiselectOptions<T>, ctx: BijouContext): Promise<T[]> {
  const noColor = ctx.theme.noColor;
  const t = ctx.theme;
  const styledFn = (token: TokenValue, text: string) => ctx.style.styled(token, text);

  let cursor = 0;
  const selected = new Set<number>();

  function render(): void {
    const label = noColor
      ? `? ${options.title}`
      : styledFn(t.theme.semantic.info, '? ') + ctx.style.bold(options.title);
    ctx.io.write(`\x1b[?25l`);
    ctx.io.write(`\r\x1b[K${label}  ${styledFn(t.theme.semantic.muted, '(space to toggle, enter to confirm)')}\n`);

    for (let i = 0; i < options.options.length; i++) {
      const opt = options.options[i]!;
      const isCurrent = i === cursor;
      const isSelected = selected.has(i);
      const prefix = isCurrent ? '\u276f' : ' ';
      const check = isSelected ? '\u25c9' : '\u25cb';
      const desc = opt.description ? styledFn(t.theme.semantic.muted, ` \u2014 ${opt.description}`) : '';
      if (isCurrent && !noColor) {
        ctx.io.write(`\x1b[K  ${styledFn(t.theme.semantic.info, prefix)} ${styledFn(t.theme.semantic.info, check)} ${ctx.style.bold(opt.label)}${desc}\n`);
      } else if (isSelected && !noColor) {
        ctx.io.write(`\x1b[K  ${prefix} ${styledFn(t.theme.semantic.success, check)} ${opt.label}${desc}\n`);
      } else {
        ctx.io.write(`\x1b[K  ${prefix} ${check} ${opt.label}${desc}\n`);
      }
    }
  }

  function clearRender(): void {
    const totalLines = options.options.length + 1;
    ctx.io.write(`\x1b[${totalLines}A`);
  }

  function cleanup(): void {
    clearRender();
    const totalLines = options.options.length + 1;
    for (let i = 0; i < totalLines; i++) ctx.io.write(`\x1b[K\n`);
    ctx.io.write(`\x1b[${totalLines}A`);
    const selectedLabels = [...selected].sort().map((i) => options.options[i]!.label).join(', ');
    const label = noColor
      ? `? ${options.title} ${selectedLabels}`
      : styledFn(t.theme.semantic.info, '? ') + ctx.style.bold(options.title) + ' ' + styledFn(t.theme.semantic.info, selectedLabels);
    ctx.io.write(`\x1b[K${label}\n`);
    ctx.io.write(`\x1b[?25h`);
  }

  render();

  return new Promise<T[]>((resolve) => {
    const handle = ctx.io.rawInput((key: string) => {
      if (key === '\x1b[A' || key === 'k') {
        cursor = (cursor - 1 + options.options.length) % options.options.length;
        clearRender(); render();
      } else if (key === '\x1b[B' || key === 'j') {
        cursor = (cursor + 1) % options.options.length;
        clearRender(); render();
      } else if (key === ' ') {
        if (selected.has(cursor)) selected.delete(cursor); else selected.add(cursor);
        clearRender(); render();
      } else if (key === '\r' || key === '\n') {
        handle.dispose(); cleanup();
        resolve([...selected].sort().map((i) => options.options[i]!.value));
      } else if (key === '\x03' || key === '\x1b') {
        handle.dispose(); cleanup(); resolve([]);
      }
    });
  });
}
