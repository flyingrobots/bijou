import type { FrameAction, FrameShellCommand } from './app-frame-types.js';

const SCROLL_ACTIONS: ReadonlySet<string> = new Set([
  'scroll-up',
  'scroll-down',
  'page-up',
  'page-down',
  'top',
  'bottom',
  'scroll-left',
  'scroll-right',
]);

/** True for the frame actions that run `scrollFocusedPane`. */
export function isScrollFrameAction(action: FrameAction): boolean {
  return SCROLL_ACTIONS.has(action.type);
}

function isScrollCommand<Msg>(command: FrameShellCommand<Msg>): boolean {
  return command.type === 'scroll-focused-pane'
    || (
      command.type === 'apply-frame-action'
      && isScrollFrameAction(command.action)
    );
}

/**
 * True when a buffered key or mouse route resolved to scroll actions and
 * nothing else (observed keys do not change frame inputs).
 */
export function handledOnlyByScroll<Msg>(
  commands: readonly FrameShellCommand<Msg>[],
): boolean {
  const relevant = commands.filter((c) => c.type !== 'observed-key');
  return relevant.length > 0 && relevant.every(isScrollCommand);
}
