import { describe, expect, it } from 'vitest';
import {
  createInputActionMap,
  createInputGestureRecognizer,
  inputEventMatches,
} from './input-map.js';
import type { KeyMsg } from './types.js';

function key(keyName: string, modifiers: Partial<Pick<KeyMsg, 'ctrl' | 'alt' | 'shift'>> = {}): KeyMsg {
  return {
    type: 'key',
    key: keyName,
    ctrl: modifiers.ctrl ?? false,
    alt: modifiers.alt ?? false,
    shift: modifiers.shift ?? false,
  };
}

describe('input feature events', () => {
  it('recognizes deterministic key double taps without emitting a timer', () => {
    const recognizer = createInputGestureRecognizer({ doubleTapMs: 250 });
    const first = recognizer.observeKey(key('tab'), 1_000);
    const second = recognizer.observeKey(key('tab'), 1_200);

    expect(inputEventMatches(first, [{ featureId: 'key.tab', type: 'tap' }])).toBe(true);
    expect(inputEventMatches(first, [{ featureId: 'key.tab', type: 'double-tap' }])).toBe(false);
    expect(inputEventMatches(second, [{ featureId: 'key.tab', type: 'double-tap' }])).toBe(true);
  });

  it('keeps modifier-held features available for compound input actions', () => {
    const recognizer = createInputGestureRecognizer({ doubleTapMs: 300 });
    recognizer.observeKey(key('tab', { ctrl: true }), 5);
    const event = recognizer.observeKey(key('tab', { ctrl: true }), 100);
    const actions = createInputActionMap<{ readonly type: 'ctrl-double-tab' }>()
      .bind('ctrlDoubleTab', 'Ctrl double-tap Tab', [
        { featureId: 'modifier.ctrl', type: 'held', deviceId: 'keyboard' },
        { featureId: 'key.tab', type: 'double-tap', deviceId: 'keyboard' },
      ], { type: 'ctrl-double-tab' });

    expect(actions.handle(event)).toEqual({ type: 'ctrl-double-tab' });
  });

  it('does not treat slow repeated key taps as double taps', () => {
    const recognizer = createInputGestureRecognizer({ doubleTapMs: 100 });

    recognizer.observeKey(key('tab'), 10);
    const event = recognizer.observeKey(key('tab'), 200);

    expect(inputEventMatches(event, [{ featureId: 'key.tab', type: 'double-tap' }])).toBe(false);
  });
});
