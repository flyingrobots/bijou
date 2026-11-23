import { createListenerSet } from './listeners.js';
import type { WebPointerEvent, WebPointerSurface, WebRect } from './web-dom.js';

/** A cell address: 0-based column and row, as every Bijou message carries it. */
export interface WebCell {
  readonly col: number;
  readonly row: number;
}

/** Grid size in cells. */
export interface WebGridSize {
  readonly columns: number;
  readonly rows: number;
}

/** Mouse message with 0-based `col` and `row`, shaped like the terminal host's. */
export interface WebMouseMsg {
  readonly type: 'mouse';
  readonly button: 'left' | 'middle' | 'right' | 'none';
  readonly action: 'press' | 'release' | 'move' | 'scroll-up' | 'scroll-down';
  readonly col: number;
  readonly row: number;
  readonly shift: boolean;
  readonly alt: boolean;
  readonly ctrl: boolean;
}

function axisCell(offset: number, extent: number, count: number): number {
  const cells = Math.max(1, Math.floor(count));
  if (!(extent > 0) || Number.isNaN(offset)) return 0;
  return Math.min(cells - 1, Math.max(0, Math.floor((offset * cells) / extent)));
}

/** Map a client point to a 0-based cell, clamped to the grid. */
export function cellAt(rect: WebRect, size: WebGridSize, x: number, y: number): WebCell {
  return {
    col: axisCell(x - rect.left, rect.width, size.columns),
    row: axisCell(y - rect.top, rect.height, size.rows),
  };
}

const SGR_BUTTON = { left: 0, middle: 1, right: 2, none: 3 } as const;

/**
 * Serialize a mouse message as an SGR packet. This is the only place a cell
 * becomes 1-based: the wire counts columns and rows from 1.
 */
export function sgrPacket(msg: WebMouseMsg): string {
  let code: number = SGR_BUTTON[msg.button];
  if (msg.action === 'scroll-up') code = 64;
  else if (msg.action === 'scroll-down') code = 65;
  else if (msg.action === 'move') code += 32;
  if (msg.shift) code += 4;
  if (msg.alt) code += 8;
  if (msg.ctrl) code += 16;
  return `\x1b[<${String(code)};${String(msg.col + 1)};${String(msg.row + 1)}${msg.action === 'release' ? 'm' : 'M'}`;
}

function buttonOf(button: number | undefined): WebMouseMsg['button'] | undefined {
  return button === 0 ? 'left' : button === 1 ? 'middle' : button === 2 ? 'right' : undefined;
}

function heldButton(buttons: number | undefined): WebMouseMsg['button'] {
  const mask = buttons ?? 0;
  return (mask & 1) !== 0 ? 'left' : (mask & 4) !== 0 ? 'middle' : (mask & 2) !== 0 ? 'right' : 'none';
}

/**
 * Turn pointer and wheel events on a surface into mouse messages.
 * @returns A function that removes every listener.
 */
export function bindPointer(
  surface: WebPointerSurface,
  size: () => WebGridSize,
  emit: (msg: WebMouseMsg) => void,
): () => void {
  const listeners = createListenerSet();
  const send = (event: WebPointerEvent, button: WebMouseMsg['button'], action: WebMouseMsg['action']): void => {
    const cell = cellAt(surface.getBoundingClientRect(), size(), event.clientX, event.clientY);
    emit({
      type: 'mouse', button, action, ...cell,
      shift: event.shiftKey === true,
      alt: event.altKey === true || event.metaKey === true,
      ctrl: event.ctrlKey === true,
    });
  };
  const click = (action: 'press' | 'release') => (event: WebPointerEvent): void => {
    const button = buttonOf(event.button);
    if (button !== undefined) send(event, button, action);
  };
  listeners.add(surface, 'pointerdown', click('press'));
  listeners.add(surface, 'pointerup', click('release'));
  listeners.add(surface, 'pointermove', (event) => { send(event, heldButton(event.buttons), 'move'); });
  listeners.add(surface, 'wheel', (event) => {
    const delta = event.deltaY ?? 0;
    if (delta === 0 || Number.isNaN(delta)) return;
    event.preventDefault?.();
    send(event, 'none', delta < 0 ? 'scroll-up' : 'scroll-down');
  }, { passive: false });
  return () => { listeners.removeAll(); };
}
