import { boxSurface, browsableListSurface, contentSurface, createBrowsableListState, enumeratedList } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';

export function explorationListPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'enumerated' | 'browsable';
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
  } = input;

  if (mode === 'enumerated') {
    const preview = enumeratedList([
      'Review deployment notes',
      'Open notification archive',
      'Promote canary',
      'Watch rollout health',
    ], {
      style: 'arabic',
      indent: 2,
      ctx,
    });

    if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
      return [title, '', preview].join('\n');
    }

    return boxSurface(contentSurface(preview), {
      title,
      width: Math.max(40, Math.min(width, 58)),
      ctx,
    });
  }

  const listState = createBrowsableListState({
    items: [
      { label: 'Release dashboard', value: 'dash', description: 'Operational overview and current rollout state' },
      { label: 'Notification archive', value: 'archive', description: 'Review earlier warnings and actions' },
      { label: 'Component field guide', value: 'docs', description: 'Reference surface for shipped families' },
      { label: 'Settings', value: 'settings', description: 'Tune shell hints and landing quality' },
    ],
    height: 4,
  });

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      '• Release dashboard',
      '• Notification archive',
      '• Component field guide',
      '• Settings',
    ].join('\n');
  }

  return boxSurface(browsableListSurface(listState, {
    width: Math.max(34, Math.min(width, 52)),
    ctx,
  }), {
    title,
    width: Math.max(38, Math.min(width, 56)),
    ctx,
  });
}
