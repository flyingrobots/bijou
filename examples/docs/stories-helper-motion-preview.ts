import { boxSurface, canvas, column, line, mutedText, spacer } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';
import { motionConstrainedSummary } from './stories-helper-motion-constrained-summary.js';
import { renderGlyphRaytracePreview } from './stories-helper-render-glyph-raytrace-preview.js';
import { renderSpringTimelinePreview } from './stories-helper-render-spring-timeline-preview.js';

export function motionPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'wave' | 'braille' | 'glyph-raytrace' | 'spring-timeline';
  readonly timeMs: number;
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
    timeMs,
  } = input;

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      motionConstrainedSummary(mode),
    ].join('\n');
  }

  const panelWidth = Math.max(42, Math.min(width, 60));
  if (mode === 'glyph-raytrace') {
    const art = renderGlyphRaytracePreview(panelWidth - 2, 9, timeMs);
    return boxSurface(column([
      art,
      spacer(),
      line(mutedText(ctx, 'Glyph-fit raytracing proves the shader path with geometry, light, and no post-process hacks.'), panelWidth - 2),
    ]), {
      title,
      width: panelWidth,
      ctx,
    });
  }

  if (mode === 'spring-timeline') {
    return renderSpringTimelinePreview({
      width: panelWidth,
      ctx,
      title,
      timeMs,
    });
  }

  const art = canvas(panelWidth - 2, 8, ({ u, v, time }) => {
    const dx = u - 0.5;
    const dy = (v - 0.5) * 1.8;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const wave = Math.sin(dist * 10 - time * 3) * 0.5 + 0.5;
    return wave > (mode === 'wave' ? 0.55 : 0.6) ? '█' : ' ';
  }, {
    time: timeMs / 1000,
    resolution: mode === 'wave' ? 'quad' : 'braille',
  });

  return boxSurface(column([
    art,
    spacer(),
    line(mutedText(ctx, mode === 'wave'
      ? 'Use motion when it reinforces state change, not just because it looks lively.'
      : 'Higher-resolution shader output still needs an honest no-motion fallback.'), panelWidth - 2),
  ]), {
    title,
    width: panelWidth,
    ctx,
  });
}
