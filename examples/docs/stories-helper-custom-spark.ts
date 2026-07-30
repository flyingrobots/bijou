import { renderByMode } from './stories-runtime.js';
import type { BijouContext } from './stories-runtime.js';

export function customSpark(label: string, value: string, ctx: BijouContext): string {
  return renderByMode(ctx.mode, {
    pipe: () => `[${label.toUpperCase()}] ${value}`,
    accessible: () => `${label}: ${value}.`,
    interactive: () => {
      const icon = ctx.style.styled(ctx.semantic('accent'), '✦');
      const labelText = ctx.style.bold(label);
      const valueText = ctx.style.styled(ctx.semantic('muted'), value);
      return `${icon} ${labelText}: ${valueText}`;
    },
  }, undefined);
}
