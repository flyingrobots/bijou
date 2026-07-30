import { boxSurface, column, contentSurface, createSpringState, line, motionTimeline, processTimeline, resolveSpringConfig, spacer, springStep } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';

export function renderSpringTimelinePreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly timeMs: number;
}): Surface {
  const {
    width,
    ctx,
    title,
    timeMs,
  } = input;
  const timeline = motionTimeline()
    .add('camera', { from: 0, to: 1, spring: 'stiff' })
    .add('glow', { type: 'tween', from: 0, to: 1, duration: 520 }, '<')
    .label('settle')
    .add('caption', { type: 'tween', from: 0, to: 1, duration: 260 }, 'settle+=120')
    .build();

  let state = timeline.init();
  const frames = Math.max(1, Math.min(90, Math.floor((timeMs / 1000) * 60)));
  for (let frame = 0; frame < frames; frame++) {
    state = timeline.step(state, 1 / 60);
  }

  const values = timeline.values(state);
  const springConfig = resolveSpringConfig('stiff');
  let springState = createSpringState(0);
  for (let frame = 0; frame < frames; frame++) {
    springState = springStep(springState, 1, springConfig, 1 / 120);
  }

  const barWidth = Math.max(10, width - 18);
  const filled = Math.max(0, Math.min(barWidth, Math.round((values.camera ?? 0) * barWidth)));
  const empty = Math.max(0, barWidth - filled);
  const process = processTimeline([
    { label: 'camera spring', description: `settled ${String(Math.round(springState.value * 100))}%`, status: 'info' },
    { label: 'shader glow', description: `opacity ${String(Math.round((values.glow ?? 0) * 100))}%`, status: 'success' },
    { label: 'caption reveal', description: `timeline ${String(Math.round((values.caption ?? 0) * 100))}%`, status: 'warning' },
  ], { ctx });

  return boxSurface(column([
    line(`spring ${'█'.repeat(filled)}${' '.repeat(empty)} ${String(Math.round((values.camera ?? 0) * 100))}%`, width - 2),
    spacer(),
    contentSurface(process),
  ]), {
    title,
    width,
    ctx,
  });
}
