import { boxSurface, createSplitPaneState, gridSurface, splitPaneSurface } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';

export function workspaceLayoutPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'split' | 'grid';
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
  } = input;

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      mode === 'split'
        ? 'Files | Editor'
        : 'Header / Navigation / Logs / Main view',
    ].join('\n');
  }

  const panelWidth = Math.max(48, Math.min(width, 64));
  const paneSize = (paneWidth: number, paneHeight: number): string => `${String(paneWidth)}x${String(paneHeight)}`;
  const body = mode === 'split'
    ? splitPaneSurface(createSplitPaneState({ ratio: 0.36, focused: 'b' }), {
        direction: 'row',
        width: panelWidth - 2,
        height: 10,
        minA: 16,
        minB: 18,
        paneA: (paneWidth, paneHeight) => boxSurface(`Files\n\n- stories.ts\n- app.ts\n- coverage.ts\n\n${paneSize(paneWidth, paneHeight)}`, {
          width: paneWidth,
          ctx,
        }),
        paneB: (paneWidth, paneHeight) => boxSurface(`Editor\n\nconst floor = 64;\nconst next = 69;\n\n${paneSize(paneWidth, paneHeight)}`, {
          width: paneWidth,
          ctx,
        }),
      })
    : gridSurface({
        width: panelWidth - 2,
        height: 10,
        columns: [18, '1fr'],
        rows: [3, '1fr', 4],
        areas: [
          'header header',
          'nav main',
          'log main',
        ],
        gap: 1,
        cells: {
          header: (paneWidth) => boxSurface('Workspace layout', { width: paneWidth, ctx }),
          nav: (paneWidth, paneHeight) => boxSurface(`Families\n\n- forms\n- docs\n- shell\n\n${paneSize(paneWidth, paneHeight)}`, { width: paneWidth, ctx }),
          log: (paneWidth, paneHeight) => boxSurface(`Log\n\n[ok] build\n[ok] docs\n\n${paneSize(paneWidth, paneHeight)}`, { width: paneWidth, ctx }),
          main: (paneWidth, paneHeight) => boxSurface(`Main pane\n\nLayout primitives keep simultaneous context honest.\n\n${paneSize(paneWidth, paneHeight)}`, { width: paneWidth, ctx }),
        },
      });

  return boxSurface(body, {
    title,
    width: panelWidth,
    ctx,
  });
}
