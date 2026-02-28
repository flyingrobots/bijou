import type { SelectFieldOptions, SelectOption } from './types.js';
import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import type { OutputMode } from '../detect/tty.js';
import { getDefaultContext } from '../../context.js';

export interface SelectOptions<T = string> extends SelectFieldOptions<T> {
  ctx?: BijouContext;
}

export async function select<T = string>(options: SelectOptions<T>): Promise<T> {
  const ctx = options.ctx ?? getDefaultContext();
  const mode = ctx.mode;

  if (mode === 'interactive' && ctx.runtime.stdinIsTTY) {
    return interactiveSelect(options, ctx);
  }

  return numberedSelect(options, mode, ctx);
}

async function numberedSelect<T>(options: SelectOptions<T>, mode: OutputMode, ctx: BijouContext): Promise<T> {
  const noColor = ctx.theme.noColor;
  const styledFn = (token: TokenValue, text: string) => ctx.style.styled(token, text);

  if (noColor || mode === 'accessible') {
    ctx.io.write(`${options.title}\n`);
  } else {
    ctx.io.write(styledFn(ctx.theme.theme.semantic.info, '? ') + ctx.style.bold(options.title) + '\n');
  }

  for (let i = 0; i < options.options.length; i++) {
    const opt = options.options[i]!;
    const num = `  ${i + 1}.`;
    const desc = opt.description ? ` \u2014 ${opt.description}` : '';
    ctx.io.write(`${num} ${opt.label}${desc}\n`);
  }

  const prompt = mode === 'accessible' ? 'Enter number: ' : '> ';
  const answer = await ctx.io.question(prompt);

  const idx = parseInt(answer.trim(), 10) - 1;
  if (idx >= 0 && idx < options.options.length) {
    return options.options[idx]!.value;
  }
  return options.defaultValue ?? options.options[0]!.value;
}

async function interactiveSelect<T>(options: SelectOptions<T>, ctx: BijouContext): Promise<T> {
  const noColor = ctx.theme.noColor;
  const t = ctx.theme;
  const styledFn = (token: TokenValue, text: string) => ctx.style.styled(token, text);

  let cursor = 0;

  function render(): void {
    const label = noColor
      ? `? ${options.title}`
      : styledFn(t.theme.semantic.info, '? ') + ctx.style.bold(options.title);
    ctx.io.write(`\x1b[?25l`);
    ctx.io.write(`\r\x1b[K${label}\n`);

    for (let i = 0; i < options.options.length; i++) {
      const opt = options.options[i]!;
      const isCurrent = i === cursor;
      const prefix = isCurrent ? '\u276f' : ' ';
      const desc = opt.description ? styledFn(t.theme.semantic.muted, ` \u2014 ${opt.description}`) : '';
      if (isCurrent && !noColor) {
        ctx.io.write(`\x1b[K  ${styledFn(t.theme.semantic.info, prefix)} ${ctx.style.bold(opt.label)}${desc}\n`);
      } else {
        ctx.io.write(`\x1b[K  ${prefix} ${opt.label}${desc}\n`);
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
    const selected = options.options[cursor] as SelectOption<T>;
    const label = noColor
      ? `? ${options.title} ${selected.label}`
      : styledFn(t.theme.semantic.info, '? ') + ctx.style.bold(options.title) + ' ' + styledFn(t.theme.semantic.info, selected.label);
    ctx.io.write(`\x1b[K${label}\n`);
    ctx.io.write(`\x1b[?25h`);
  }

  render();

  return new Promise<T>((resolve) => {
    const handle = ctx.io.rawInput((key: string) => {
      if (key === '\x1b[A' || key === 'k') {
        cursor = (cursor - 1 + options.options.length) % options.options.length;
        clearRender(); render();
      } else if (key === '\x1b[B' || key === 'j') {
        cursor = (cursor + 1) % options.options.length;
        clearRender(); render();
      } else if (key === '\r' || key === '\n') {
        handle.dispose(); cleanup(); resolve(options.options[cursor]!.value);
      } else if (key === '\x03' || key === '\x1b') {
        handle.dispose(); cleanup(); resolve(options.defaultValue ?? options.options[0]!.value);
      }
    });
  });
}
