import { createKeyMap, type KeyMap } from './keybindings.js';

// ---------------------------------------------------------------------------
// Convenience keymap
// ---------------------------------------------------------------------------

/**
 * Create a preconfigured KeyMap for command palette navigation.
 *
 * Bindings: Ctrl+N/Down (next), Ctrl+P/Up (prev), Ctrl+D/PageDown (page down),
 * Ctrl+U/PageUp (page up), Enter (select), Escape (close).
 *
 * Ctrl+D and Ctrl+U follow vim half-page scroll conventions. In raw-mode TUIs
 * these do not conflict with shell behavior (EOF / line-clear).
 *
 * ```ts
 * const keys = commandPaletteKeyMap({
 *   focusNext: { type: 'cp-next' },
 *   focusPrev: { type: 'cp-prev' },
 *   pageDown: { type: 'cp-page-down' },
 *   pageUp: { type: 'cp-page-up' },
 *   select: { type: 'cp-select' },
 *   close: { type: 'cp-close' },
 * });
 * ```
 *
 * @template Msg - Application message type dispatched by key bindings.
 * @param actions - Map of navigation and selection actions to message values.
 * @returns Preconfigured key map with Ctrl+N/P, arrow, and page navigation bindings.
 */
export function commandPaletteKeyMap<Msg>(actions: {
  focusNext: Msg;
  focusPrev: Msg;
  pageDown: Msg;
  pageUp: Msg;
  select: Msg;
  close: Msg;
}): KeyMap<Msg> {
  return createKeyMap<Msg>()
    .group('Navigation', (g) => g
      .bind('ctrl+n', 'Next item', actions.focusNext)
      .bind('down', 'Next item', actions.focusNext)
      .bind('ctrl+p', 'Previous item', actions.focusPrev)
      .bind('up', 'Previous item', actions.focusPrev)
      .bind('ctrl+d', 'Half page down', actions.pageDown)
      .bind('pagedown', 'Half page down', actions.pageDown)
      .bind('ctrl+u', 'Half page up', actions.pageUp)
      .bind('pageup', 'Half page up', actions.pageUp),
    )
    .bind('enter', 'Select', actions.select)
    .bind('escape', 'Close', actions.close);
}
