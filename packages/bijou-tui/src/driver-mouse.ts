import { parseMouse } from './keys.js';
import type {
  MouseButton,
  MouseMsg,
} from './types.js';
import type {
  MouseMoveStepOptions,
  MouseScriptStep,
  MouseScriptStepOptions,
  MouseWheelDirection,
} from './driver-contract.js';

function mouseMsg(
  button: MouseButton,
  action: MouseMsg['action'],
  col: number,
  row: number,
  options: MouseScriptStepOptions,
): MouseMsg {
  return {
    type: 'mouse',
    button,
    action,
    col,
    row,
    shift: options.shift ?? false,
    alt: options.alt ?? false,
    ctrl: options.ctrl ?? false,
  };
}

function mouseStep<M>(
  mouse: MouseMsg,
  delay?: number,
): MouseScriptStep<M> {
  return delay === undefined ? { mouse } : { mouse, delay };
}

/** Create a scripted mouse-move step. */
export function mouseMove<M = never>(
  col: number,
  row: number,
  options: MouseMoveStepOptions = {},
): MouseScriptStep<M> {
  return mouseStep(
    mouseMsg(options.button ?? 'none', 'move', col, row, options),
    options.delay,
  );
}

/** Create a scripted mouse-press step. */
export function mousePress<M = never>(
  button: Exclude<MouseButton, 'none'>,
  col: number,
  row: number,
  options: MouseScriptStepOptions = {},
): MouseScriptStep<M> {
  return mouseStep(mouseMsg(button, 'press', col, row, options), options.delay);
}

/** Create a scripted mouse-release step. */
export function mouseRelease<M = never>(
  button: Exclude<MouseButton, 'none'>,
  col: number,
  row: number,
  options: MouseScriptStepOptions = {},
): MouseScriptStep<M> {
  return mouseStep(
    mouseMsg(button, 'release', col, row, options),
    options.delay,
  );
}

/** Create a scripted mouse-wheel step. */
export function mouseWheel<M = never>(
  direction: MouseWheelDirection,
  col: number,
  row: number,
  options: MouseScriptStepOptions = {},
): MouseScriptStep<M> {
  const action = direction === 'up' ? 'scroll-up' : 'scroll-down';
  return mouseStep(mouseMsg('none', action, col, row, options), options.delay);
}

/** Parse an SGR mouse escape sequence into a scripted mouse step. */
export function sgrMouse<M = never>(
  raw: string,
  delay?: number,
): MouseScriptStep<M> {
  const mouse = parseMouse(raw);
  if (mouse == null) {
    throw new Error(
      `sgrMouse: invalid SGR mouse sequence: ${JSON.stringify(raw)}`,
    );
  }
  return mouseStep(mouse, delay);
}
