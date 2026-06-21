import { createKeyMap } from './keybindings.js';

import type { KeyMap } from './keybindings.js';
export function accordionKeyMap<Msg>(actions: {
  focusNext: Msg;
  focusPrev: Msg;
  toggle: Msg;
  quit: Msg;
}): KeyMap<Msg> {
  return createKeyMap<Msg>()
    .group('Navigation', (g) => g
      .bind('j', 'Next section', actions.focusNext)
      .bind('down', 'Next section', actions.focusNext)
      .bind('k', 'Previous section', actions.focusPrev)
      .bind('up', 'Previous section', actions.focusPrev),
    )
    .group('Actions', (g) => g
      .bind('enter', 'Toggle section', actions.toggle)
      .bind('space', 'Toggle section', actions.toggle),
    )
    .bind('q', 'Quit', actions.quit)
    .bind('ctrl+c', 'Quit', actions.quit);
}
