import { boxSurface, column, commandPaletteSurface, cpFilter, createCommandPaletteState, createSurface, line, spacer, statusBarSurface } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';

export function appShellPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'shell' | 'palette';
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
      'DOGFOOD shell',
      'Page: Docs',
      mode === 'palette' ? 'Command palette: search “docs”' : 'Status: NORMAL • docs • ctrl+p palette',
    ].join('\n');
  }

  const screenWidth = Math.max(50, Math.min(width, 66));
  const screenHeight = 14;
  const screen = createSurface(screenWidth, screenHeight);
  const header = statusBarSurface({
    left: 'DOGFOOD',
    center: mode === 'palette' ? 'command discovery' : 'docs workspace',
    right: 'ctrl+p palette',
    width: screenWidth,
    fillChar: '─',
  });
  const footer = statusBarSurface({
    left: 'NORMAL',
    center: 'page:docs',
    right: '? help • / search',
    width: screenWidth,
    fillChar: '─',
  });
  const pane = boxSurface(column([
    line('Current page', screenWidth - 8),
    spacer(),
    line('DOGFOOD now teaches shell chrome, overlays, and docs content in the same runtime.', screenWidth - 8),
  ]), {
    title,
    width: screenWidth - 4,
    ctx,
  });
  screen.blit(header, 0, 0);
  screen.blit(pane, 2, 2);
  screen.blit(footer, 0, screenHeight - 1);

  if (mode === 'palette') {
    const paletteState = cpFilter(createCommandPaletteState([
      { id: 'docs', label: 'Open docs', description: 'Jump to the field guide', category: 'Navigate' },
      { id: 'download', label: 'Download coverage report', description: 'Open the latest docs summary', category: 'Actions' },
      { id: 'settings', label: 'Open settings', description: 'Shell-level preferences', category: 'Shell', shortcut: 'F2' },
      { id: 'notify', label: 'Review notifications', description: 'Open the notice drawer', category: 'Shell' },
    ], 4), 'do');
    const palette = commandPaletteSurface(paletteState, {
      width: Math.max(30, screenWidth - 12),
      ctx,
    });
    screen.blit(palette, 6, 4);
  }

  return screen;
}
