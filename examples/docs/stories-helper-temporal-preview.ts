import { boxSurface, contentSurface, dag, processTimeline } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';

export function temporalPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'timeline' | 'dag';
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
  } = input;

  const preview = mode === 'timeline'
    ? processTimeline([
        { label: 'Build created', description: 'Artifacts stamped for review', status: 'success' },
        { label: 'Canary promoted', description: '10% traffic live in eu-west', status: 'info' },
        { label: 'Latency drift detected', description: 'Retry backlog climbed above baseline', status: 'warning' },
      ], { ctx })
    : dag([
        { id: 'build', label: 'Build', edges: ['test'], badge: 'DONE' },
        { id: 'test', label: 'Test', edges: ['review'], badge: 'DONE' },
        { id: 'review', label: 'Review', edges: ['deploy'], badge: 'READY' },
        { id: 'deploy', label: 'Deploy', badge: 'BLOCKED' },
      ], { ctx });

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [title, '', preview].join('\n');
  }

  return boxSurface(contentSurface(preview), {
    title,
    width: Math.max(42, Math.min(width, 64)),
    ctx,
  });
}
