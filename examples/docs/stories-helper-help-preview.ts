import { boxSurface, column, helpShort, helpShortSurface, helpView, helpViewSurface, line, spacer } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';
import { HELP_PREVIEW_KEYS } from './stories-helper-help-preview-keys.js';

export function helpPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'hint' | 'reference';
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
  } = input;
  const panelWidth = Math.max(42, Math.min(width, 62));
  const innerWidth = Math.max(20, panelWidth - 2);

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    if (mode === 'hint') {
      return [
        title,
        '',
        helpShort(HELP_PREVIEW_KEYS),
      ].join('\n');
    }

    return [
      title,
      '',
      helpView(HELP_PREVIEW_KEYS, { title: 'Keyboard shortcuts' }),
    ].join('\n');
  }

  if (mode === 'hint') {
    return boxSurface(column([
      line('Shell footer hint', innerWidth),
      spacer(),
      helpShortSurface(HELP_PREVIEW_KEYS, { width: innerWidth }),
    ]), {
      title,
      width: panelWidth,
      ctx,
    });
  }

  return boxSurface(helpViewSurface(HELP_PREVIEW_KEYS, {
    title: 'Keyboard shortcuts',
    width: innerWidth,
  }), {
    title,
    width: panelWidth,
    ctx,
  });
}
