import type { Cmd } from './types.js';
import type { FramePage } from './app-frame-page-contract.js';
import type { FramedAppMsg } from './app-frame-types.js';
import { wrapFrameMsg } from './app-frame-types.js';
import type { KeyMap } from './keybindings.js';
import type { FrameAction } from './app-frame-action-types.js';
import {
  describeKeyBindingConflict,
  findKeyBindingConflicts,
  type KeyBindingSource,
} from './keybindings-conflicts.js';

export interface FrameKeyConflictInitDependencies<PageModel, Msg> {
  readonly pages: readonly FramePage<PageModel, Msg>[];
  readonly frameKeys: KeyMap<FrameAction>;
  readonly keyPriority: 'frame-first' | 'page-first';
  readonly now: () => number;
}

/**
 * Report key combos claimed twice, once per frame start, as runtime-issue
 * warnings. Each page is checked against the frame (and against itself); two
 * different pages may reuse a key because only one page is active at a time.
 * Sources are ordered by `keyPriority`, so the message names the real winner.
 */
export function frameKeyConflictInitCommands<PageModel, Msg>(
  dependencies: FrameKeyConflictInitDependencies<PageModel, Msg>,
): Cmd<FramedAppMsg<Msg>>[] {
  const { frameKeys, keyPriority, now, pages } = dependencies;
  const frame: KeyBindingSource = { source: 'frame', bindings: frameKeys.bindings() };
  const messages: string[] = [];
  for (const [id, keyMap] of pages.map((page) => [page.id, page.keyMap] as const)) {
    if (keyMap == null) continue;
    const page: KeyBindingSource = { source: `page "${id}"`, bindings: keyMap.bindings() };
    const sources = keyPriority === 'page-first' ? [page, frame] : [frame, page];
    for (const conflict of findKeyBindingConflicts(sources)) {
      if (conflict.claims.some((claim) => claim.source === page.source)) {
        messages.push(describeKeyBindingConflict(conflict));
      }
    }
  }
  return messages.map((message) => () =>
    wrapFrameMsg({
      type: 'runtime-issue',
      issue: { level: 'warning', source: 'runtime', message, atMs: now() },
    }),
  );
}
