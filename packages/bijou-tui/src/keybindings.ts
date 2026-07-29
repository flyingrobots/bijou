/**
 * Declarative keybinding manager for TUI applications.
 *
 * Matches incoming KeyMsg events against registered bindings and returns
 * the associated action. Bindings can be enabled/disabled at runtime
 * and carry help text for automatic help generation.
 *
 * ```ts
 * const kb = createKeyMap<Msg>()
 *   .bind('q', 'Quit', { type: 'quit' })
 *   .bind('?', 'Toggle help', { type: 'toggle-help' })
 *   .bind('ctrl+c', 'Force quit', { type: 'force-quit' })
 *   .group('Navigation', (g) => g
 *     .bind('j', 'Down', { type: 'move', dir: 'down' })
 *     .bind('k', 'Up', { type: 'move', dir: 'up' })
 *   );
 *
 * // In TEA update:
 * const action = kb.handle(keyMsg);
 * if (action !== undefined) return [model, action];
 * ```
 */

export type { Binding, BindingInfo, KeyCombo, KeyMapGroup } from './keybindings.part01.js';
export type { KeyMap } from './keybindings.part02.js';
export { formatKeyCombo, parseKeyCombo } from './keybindings.part03.js';
export { createKeyMap } from './keybindings.part04.js';
