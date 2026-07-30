import { boxSurface, breadcrumb, contentSurface, paginator, stepper } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';

export function pathAndProgressPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'wayfinding' | 'rollout';
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
  } = input;

  const text = mode === 'wayfinding'
    ? [
        breadcrumb(['Workspace', 'Docs', 'Families', 'Progress indicators'], { ctx }),
        '',
        paginator({ current: 2, total: 7, style: 'text', ctx }),
      ].join('\n')
    : [
        stepper([
          { label: 'Build' },
          { label: 'Review' },
          { label: 'Canary' },
          { label: 'Promote' },
        ], { current: 2, ctx }),
        '',
        breadcrumb(['Release', 'Canary', 'eu-west'], { ctx }),
      ].join('\n');

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      text,
    ].join('\n');
  }

  return boxSurface(contentSurface(text), {
    title,
    width: Math.max(44, Math.min(width, 62)),
    ctx,
  });
}
