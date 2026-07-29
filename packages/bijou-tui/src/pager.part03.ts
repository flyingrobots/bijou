/**
 * Pager building block — a scrollable text viewer with status line.
 *
 * Wraps `viewport()` with a "Line N/M" status indicator and provides
 * a convenience keymap for vim-style scroll navigation.
 *
 * ```ts
 * // In TEA init:
 * const pagerState = createPagerState({ content, width: 80, height: 20 });
 *
 * // In TEA view:
 * const output = pager(model.pagerState);
 *
 * // In TEA update:
 * case 'scroll-down':
 *   return [{ ...model, pagerState: pagerScrollBy(model.pagerState, 1) }, []];
 * ```
 */
import {
  createSurface,
  stringToSurface,
  type Surface,
} from '@flyingrobots/bijou';
import { viewportSurface } from './viewport.js';
import { createKeyMap, type KeyMap } from './keybindings.js';
import { type PagerRenderOptions, type PagerState } from './pager.part01.js';

/**
 * Render the pager directly into a surface.
 *
 * Pairs with {@link createPagerStateForSurface} so already-rendered pane
 * content can stay on the structured surface path instead of dropping back
 * through the string viewport helper.
 */
export function pagerSurface(
  content: Surface,
  state: PagerState,
  options?: PagerRenderOptions,
): Surface {
  const showScrollbar = options?.showScrollbar ?? true;
  const scrollbarMode = options?.scrollbarMode ?? 'gutter';
  const showStatus = options?.showStatus ?? true;
  const safeWidth = Math.max(0, Math.floor(state.width));
  const safeHeight = Math.max(0, Math.floor(state.height));

  if (safeWidth === 0 || safeHeight === 0) return createSurface(0, 0);

  const viewportHeight = showStatus ? Math.max(1, safeHeight - 1) : safeHeight;

  const maxY = Math.max(0, content.height - viewportHeight);
  const clampedY = Math.max(0, Math.min(state.scroll.y, maxY));
  const body = viewportSurface({
    width: safeWidth,
    height: viewportHeight,
    content,
    scrollY: clampedY,
    showScrollbar,
    scrollbarMode,
  });

  if (!showStatus) return body;

  const currentLine = clampedY + 1;
  const totalLines = content.height;
  const status = stringToSurface(
    `  Line ${String(currentLine)}/${String(totalLines)}`,
    safeWidth,
    1,
  );
  const result = createSurface(safeWidth, safeHeight, {
    char: ' ',
    empty: false,
  });
  result.blit(body, 0, 0);
  result.blit(status, 0, safeHeight - 1);
  return result;
}
// Convenience keymap

/**
 * Create a preconfigured KeyMap for pager navigation.
 *
 * The caller provides their own message types for each action:
 * ```ts
 * const keys = pagerKeyMap({
 *   scrollUp: { type: 'scroll', dy: -1 },
 *   scrollDown: { type: 'scroll', dy: 1 },
 *   pageUp: { type: 'page-up' },
 *   pageDown: { type: 'page-down' },
 *   top: { type: 'top' },
 *   bottom: { type: 'bottom' },
 *   quit: { type: 'quit' },
 * });
 * ```
 *
 * @template Msg - Application message type dispatched by key bindings.
 * @param actions - Map of navigation actions to message values.
 * @returns Preconfigured key map with vim-style pager bindings.
 */
export function pagerKeyMap<Msg>(actions: {
  scrollUp: Msg;
  scrollDown: Msg;
  pageUp: Msg;
  pageDown: Msg;
  top: Msg;
  bottom: Msg;
  quit: Msg;
}): KeyMap<Msg> {
  return createKeyMap<Msg>()
    .group('Scroll', (g) =>
      g
        .bind('k', 'Up', actions.scrollUp)
        .bind('up', 'Up', actions.scrollUp)
        .bind('j', 'Down', actions.scrollDown)
        .bind('down', 'Down', actions.scrollDown)
        .bind('u', 'Page up', actions.pageUp)
        .bind('pageup', 'Page up', actions.pageUp)
        .bind('d', 'Page down', actions.pageDown)
        .bind('pagedown', 'Page down', actions.pageDown)
        .bind('g', 'Top', actions.top)
        .bind('shift+g', 'Bottom', actions.bottom),
    )
    .bind('q', 'Quit', actions.quit)
    .bind('ctrl+c', 'Quit', actions.quit);
}
