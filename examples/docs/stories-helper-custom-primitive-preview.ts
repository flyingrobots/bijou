import { boxSurface, contentSurface } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';
import { customSpark } from './stories-helper-custom-spark.js';

export function customPrimitivePreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
}): string | Surface {
  const {
    width,
    ctx,
    title,
  } = input;
  const preview = [
    customSpark('Deploy', 'v5.2.1 rolling', ctx),
    customSpark('Docs', 'coverage floor met', ctx),
  ].join('\n');

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      preview,
    ].join('\n');
  }

  return boxSurface(contentSurface(preview), {
    title,
    width: Math.max(40, Math.min(width, 56)),
    ctx,
  });
}
