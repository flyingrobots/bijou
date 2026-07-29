/**
 * Input feature events and semantic action maps.
 *
 * This module sits above raw terminal input parsing and below app/frame
 * reducers. It lets shells bind actions to semantic input feature events such
 * as "keyboard.tab double-tap" without hard-coding gesture state into a single
 * component.
 */
import type { KeyMsg } from './types.js';

export function keySignature(msg: KeyMsg): string {
  return [
    msg.ctrl ? 'ctrl' : '',
    msg.alt ? 'alt' : '',
    msg.shift ? 'shift' : '',
    msg.key,
  ].join('|');
}
export function normalizeId(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized === '') {
    throw new Error(`${label} is required`);
  }
  return normalized;
}
export function normalizeTimestamp(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error('input event timestamp must be finite');
  }
  return value;
}
export function normalizePositiveDuration(
  value: number | undefined,
  fallback: number,
): number {
  if (value == null) return fallback;
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(
      'input gesture doubleTapMs must be a positive finite number',
    );
  }
  return value;
}
export function freezePlain<T extends object>(value: T): T {
  return Object.freeze(value);
}
