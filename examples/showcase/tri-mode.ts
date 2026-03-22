import type { BijouContext, OutputMode } from '@flyingrobots/bijou';
import { separator, surfaceToString } from '@flyingrobots/bijou';
import type { ComponentPreview } from './types.js';

/**
 * Create a shallow copy of ctx with a different output mode.
 * Components that branch on `ctx.mode` will render their alternate output.
 */
function withMode(ctx: BijouContext, mode: OutputMode): BijouContext {
  return { ...ctx, mode };
}

/**
 * Render a component in all 3 output modes stacked vertically.
 * Each section is labeled with a separator.
 */
export function triModePreview(
  renderFn: (width: number, ctx: BijouContext) => ComponentPreview,
  width: number,
  ctx: BijouContext,
): string {
  const modes: { label: string; mode: OutputMode }[] = [
    { label: 'Rich (interactive)', mode: 'interactive' },
    { label: 'Pipe (non-TTY)', mode: 'pipe' },
    { label: 'Accessible', mode: 'accessible' },
  ];

  const innerWidth = Math.max(20, width - 2);
  const sections: string[] = [];

  for (const { label, mode } of modes) {
    const modeCtx = withMode(ctx, mode);
    const sep = separator({ label, width: innerWidth, ctx });
    let rendered: string;
    try {
      const preview = renderFn(innerWidth, modeCtx);
      rendered = typeof preview === 'string'
        ? preview
        : surfaceToString(preview, modeCtx.style);
    } catch {
      rendered = `  (render error in ${mode} mode)`;
    }
    sections.push(sep, rendered, '');
  }

  return sections.join('\n');
}
