import { createSurface, parseAnsiToSurface } from '@flyingrobots/bijou';

import type { Surface } from '@flyingrobots/bijou';

import { createKeyMap } from './keybindings.js';

import type { KeyMap } from './keybindings.js';

import { vstackSurface } from './surface-layout.js';

import { viewportSurface, visibleLength } from './viewport.js';

import type { FilePickerState, FilePickerSurfaceOptions } from './file-picker.part01.js';

import { renderFilePickerEntryLines } from './file-picker.part02.js';
export function filePickerSurface(
  state: FilePickerState,
  options?: FilePickerSurfaceOptions,
): Surface {
  const entryLines = renderFilePickerEntryLines(state, options);
  const width = Math.max(
    1,
    options?.width ?? 0,
    visibleLength(state.cwd),
    ...entryLines.map((line) => visibleLength(line)),
  );

  const headerSurface = parseAnsiToSurface(state.cwd, width, 1);
  const listSurface = entryLines.length === 0
    ? createSurface(width, Math.max(1, state.height))
    : viewportSurface({
      width,
      height: Math.max(1, state.height),
      content: entryLines.join('\n'),
      scrollY: state.scrollY,
      showScrollbar: options?.showScrollbar ?? false,
    });

  return vstackSurface(headerSurface, listSurface);
}
export function filePickerKeyMap<Msg>(actions: {
  focusNext: Msg;
  focusPrev: Msg;
  enter: Msg;
  back: Msg;
  quit: Msg;
}): KeyMap<Msg> {
  return createKeyMap<Msg>()
    .group('Navigation', (g) => g
      .bind('j', 'Next entry', actions.focusNext)
      .bind('down', 'Next entry', actions.focusNext)
      .bind('k', 'Previous entry', actions.focusPrev)
      .bind('up', 'Previous entry', actions.focusPrev),
    )
    .group('Actions', (g) => g
      .bind('enter', 'Enter directory / select file', actions.enter)
      .bind('backspace', 'Parent directory', actions.back)
      .bind('left', 'Parent directory', actions.back),
    )
    .bind('q', 'Quit', actions.quit)
    .bind('ctrl+c', 'Quit', actions.quit);
}
