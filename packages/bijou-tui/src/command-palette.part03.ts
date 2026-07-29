import type { Surface } from '@flyingrobots/bijou';
import { clipToWidth, viewportSurface } from './viewport.js';
import { vstackSurface } from './surface-layout.js';
import { collectionRowsSurface, insetLineSurface } from './collection-surface.js';
import type { CommandPaletteOptions, CommandPaletteState, CommandPaletteSurfaceOptions } from './command-palette.part01.js';

function renderCommandPaletteLines(
  state: CommandPaletteState,
  options: Pick<CommandPaletteOptions, 'showCategory' | 'showShortcut' | 'ctx'>,
): string[] {
  const { showCategory = true, showShortcut = true, ctx } = options;

  if (state.filteredItems.length === 0) {
    return ['  No matches'];
  }

  const indicator = '\u25b8';
  const pad = ' ';
  const muted = (text: string) =>
    ctx ? ctx.style.styled(ctx.semantic('muted'), text) : text;

  return state.filteredItems.map((item, index) => {
    const prefix = index === state.focusIndex ? indicator : pad;
    const parts: string[] = [];

    if (showCategory && item.category) {
      parts.push(muted(`[${item.category}]`));
    }

    parts.push(item.label);

    if (item.description) {
      parts.push(muted(item.description));
    }

    if (showShortcut && item.shortcut) {
      parts.push(muted(item.shortcut));
    }

    return `${prefix} ${parts.join('  ')}`;
  });
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/**
 * Render the command palette to a plain string boundary.
 *
 * Prefer {@link commandPaletteSurface} for in-app TUI rendering so the
 * palette stays on the Surface path end-to-end.
 *
 * Layout:
 * - Line 1: `> {query}` search input
 * - Lines 2+: filtered items in viewport
 * - Each item: `[category] label  description  shortcut`
 * - Focus indicator: `▸` on focused item
 *
 * @param state - Current command palette state.
 * @param options - Width, display flags, and context for rendering.
 * @returns Rendered command palette string with search line and item list.
 */
export function commandPalette(
  state: CommandPaletteState,
  options: CommandPaletteOptions,
): string {
  const { width, showCategory = true, showShortcut = true, ctx } = options;
  const lines: string[] = [clipToWidth(`> ${state.query}`, width)];
  const itemLines = renderCommandPaletteLines(state, {
    showCategory,
    showShortcut,
    ctx,
  });
  lines.push(
    ...itemLines
      .slice(state.scrollY, state.scrollY + state.height)
      .map((line) => clipToWidth(line, width)),
  );
  return lines.join('\n');
}

/**
 * Render the command palette into a `Surface`.
 *
 * The search prompt stays fixed while results are masked by the shared
 * `viewportSurface()` primitive rather than carrying bespoke slice logic.
 *
 * @param state - Current command palette state.
 * @param options - Width, display flags, and context for rendering.
 * @returns Surface containing the search line and scrollable result list.
 */
export function commandPaletteSurface(
  state: CommandPaletteState,
  options: CommandPaletteSurfaceOptions,
): Surface {
  const width = Math.max(1, options.width);
  const itemLines = renderCommandPaletteLines(state, options);
  const searchSurface = insetLineSurface(clipToWidth(`> ${state.query}`, width), width);
  const content = collectionRowsSurface(itemLines, {
    width,
    selectedRowIndex: state.filteredItems.length === 0 ? undefined : state.focusIndex,
    ctx: options.ctx,
  });
  const listSurface = viewportSurface({
    width,
    height: Math.max(1, state.height),
    content,
    scrollY: state.scrollY,
    showScrollbar: options.showScrollbar ?? false,
  });

  return vstackSurface(searchSurface, listSurface);
}
