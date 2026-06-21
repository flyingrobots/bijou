import { createKeyMap } from './keybindings.js';

import type { KeyMap } from './keybindings.js';
export function dagPaneKeyMap<Msg>(actions: {
  selectParent: Msg;
  selectChild: Msg;
  selectLeft: Msg;
  selectRight: Msg;
  scrollUp: Msg;
  scrollDown: Msg;
  scrollLeft: Msg;
  scrollRight: Msg;
  pageUp: Msg;
  pageDown: Msg;
  top: Msg;
  bottom: Msg;
  confirm: Msg;
  quit: Msg;
}): KeyMap<Msg> {
  return createKeyMap<Msg>()
    .group('Selection', (g) => g
      .bind('up', 'Select parent', actions.selectParent)
      .bind('down', 'Select child', actions.selectChild)
      .bind('left', 'Select left', actions.selectLeft)
      .bind('right', 'Select right', actions.selectRight),
    )
    .group('Scroll', (g) => g
      .bind('j', 'Down', actions.scrollDown)
      .bind('k', 'Up', actions.scrollUp)
      .bind('h', 'Scroll left', actions.scrollLeft)
      .bind('l', 'Scroll right', actions.scrollRight)
      .bind('d', 'Page down', actions.pageDown)
      .bind('u', 'Page up', actions.pageUp)
      .bind('g', 'Top', actions.top)
      .bind('shift+g', 'Bottom', actions.bottom),
    )
    .bind('enter', 'Confirm', actions.confirm)
    .bind('q', 'Quit', actions.quit)
    .bind('ctrl+c', 'Quit', actions.quit);
}
