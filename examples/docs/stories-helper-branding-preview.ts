import { boxSurface, column, contentSurface, gradientText, line, loadRandomLogo, mutedText, spacer } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';

export function brandingPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'launch' | 'heading';
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
  } = input;
  const stops = ctx.theme.theme.gradient.brand;
  const logo = loadRandomLogo('logos', 'bijou', 'small', undefined, {
    ctx,
    fallbackText: 'BIJOU',
  }).text;
  const heading = gradientText(
    mode === 'launch' ? 'Documentation you can ship' : 'Release ready',
    stops,
    { style: ctx.style, noColor: ctx.theme.noColor },
  );

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      logo,
      '',
      mode === 'launch' ? 'Documentation you can ship' : 'Release ready',
    ].join('\n');
  }

  return boxSurface(column([
    contentSurface(logo),
    spacer(),
    line(heading, Math.max(22, width - 8)),
    ...(mode === 'launch'
      ? [line(mutedText(ctx, 'Brand moments should open the experience, then get out of the way.'), Math.max(22, width - 8))]
      : [line(mutedText(ctx, 'Expressive emphasis should remain rare and clearly non-critical.'), Math.max(22, width - 8))]),
  ]), {
    title,
    width: Math.max(42, Math.min(width, 62)),
    ctx,
  });
}
