import { boxSurface, contentSurface, filePickerSurface, tree } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';

export function hierarchyPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'tree' | 'picker';
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
  } = input;

  if (mode === 'tree') {
    const preview = tree([
      { label: 'src', children: [
        { label: 'components', children: [{ label: 'box.ts' }, { label: 'table.ts' }] },
        { label: 'stories', children: [{ label: 'stories.ts' }] },
      ]},
      { label: 'docs', children: [{ label: 'design-system' }, { label: 'legends' }] },
      { label: 'package.json' },
    ], { ctx });

    if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
      return [title, '', preview].join('\n');
    }

    return boxSurface(contentSurface(preview), {
      title,
      width: Math.max(42, Math.min(width, 58)),
      ctx,
    });
  }

  const pickerState = {
    cwd: '/workspace/bijou',
    entries: [
      { name: 'docs', isDirectory: true },
      { name: 'examples', isDirectory: true },
      { name: 'packages', isDirectory: true },
      { name: 'README.md', isDirectory: false },
      { name: 'package.json', isDirectory: false },
    ],
    focusIndex: 2,
    scrollY: 0,
    height: 5,
  };

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      '/workspace/bijou',
      '  docs/',
      '  examples/',
      '▶ packages/',
      '  README.md',
      '  package.json',
    ].join('\n');
  }

  return boxSurface(filePickerSurface(pickerState, {
    width: Math.max(28, Math.min(width, 44)),
  }), {
    title,
    width: Math.max(34, Math.min(width, 48)),
    ctx,
  });
}
