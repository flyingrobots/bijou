import { describe, expect, it } from 'vitest';
import type { KeyInputMsg } from '@flyingrobots/bijou';
import { createWebInteractiveIO } from './index.js';
import type { WebTextEvent } from './web-dom.js';
import { createFakeTarget, withPrevent } from './interactive.test-support.js';

interface KeyFields {
  readonly key: string;
  readonly ctrlKey?: boolean;
  readonly altKey?: boolean;
  readonly shiftKey?: boolean;
  readonly metaKey?: boolean;
  readonly isComposing?: boolean;
}

function setup(platform?: 'mac' | 'other') {
  const textarea = Object.assign(createFakeTarget<WebTextEvent>(), { value: '' });
  const io = createWebInteractiveIO({ textarea, ...(platform === undefined ? {} : { platform }) });
  const keys: KeyInputMsg[] = [];
  const raw: string[] = [];
  io.keyInput((key) => keys.push(key));
  io.rawInput((data) => raw.push(data));
  const press = (fields: KeyFields) => textarea.dispatch('keydown', withPrevent(fields));
  return { textarea, io, keys, raw, press };
}

const plain = { ctrl: false, alt: false, shift: false };

describe('createWebInteractiveIO() keyboard', () => {
  it.each([
    ['ArrowUp', 'up', '\x1b[A'],
    ['ArrowDown', 'down', '\x1b[B'],
    ['ArrowRight', 'right', '\x1b[C'],
    ['ArrowLeft', 'left', '\x1b[D'],
    ['Enter', 'enter', '\r'],
    ['Escape', 'escape', '\x1b'],
    ['Tab', 'tab', '\t'],
    ['Backspace', 'backspace', '\x7f'],
    ['F2', 'f2', '\x1b[12~'],
    ['F12', 'f12', '\x1b[24~'],
    ['PageDown', 'pagedown', '\x1b[6~'],
  ])('delivers the %s key as %s and its raw encoding', (key, name, encoded) => {
    const { keys, raw, press } = setup();
    const event = press({ key });
    expect(keys).toEqual([{ key: name, ...plain }]);
    expect(raw).toEqual([encoded]);
    expect(event.prevented()).toBe(true);
  });

  it('delivers Ctrl+C as ctrl and c', () => {
    const { keys, raw, press } = setup();
    press({ key: 'c', ctrlKey: true });
    expect(keys).toEqual([{ key: 'c', ctrl: true, alt: false, shift: false }]);
    expect(raw).toEqual(['\x03']);
  });

  it('delivers Shift+Tab, and Alt as the alt modifier', () => {
    const { keys, press } = setup();
    press({ key: 'Tab', shiftKey: true });
    press({ key: 'x', altKey: true });
    expect(keys).toEqual([
      { key: 'tab', ctrl: false, alt: false, shift: true },
      { key: 'x', ctrl: false, alt: true, shift: false },
    ]);
  });

  it('delivers printable text with the text payload, and uppercase as shifted', () => {
    const { keys, raw, press } = setup();
    press({ key: 'a' });
    press({ key: 'G', shiftKey: true });
    press({ key: ' ' });
    press({ key: '!', shiftKey: true });
    expect(keys).toEqual([
      { key: 'a', ...plain, text: 'a' },
      { key: 'g', ctrl: false, alt: false, shift: true, text: 'G' },
      { key: 'space', ...plain, text: ' ' },
      { key: '!', ...plain, text: '!' },
    ]);
    expect(raw).toEqual(['a', 'G', ' ', '!']);
  });

  it.each(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Dead', 'Unidentified', 'Process'])(
    'ignores the %s key without preventing it',
    (key) => {
      const { keys, raw, press } = setup();
      const event = press({ key });
      expect(keys).toEqual([]);
      expect(raw).toEqual([]);
      expect(event.prevented()).toBe(false);
    },
  );
});

describe('createWebInteractiveIO() shortcut pass-through', () => {
  it.each(['r', 'w', 't', 'l', 'c', 'v'])('lets macOS Meta+%s reach the browser', (key) => {
    const { keys, press } = setup('mac');
    const event = press({ key, metaKey: true });
    expect(keys).toEqual([]);
    expect(event.prevented()).toBe(false);
  });

  it.each([
    [{ key: 'F12' }],
    [{ key: 'I', ctrlKey: true, shiftKey: true }],
    [{ key: 't', ctrlKey: true }],
    [{ key: 'n', ctrlKey: true }],
    [{ key: 'v', ctrlKey: true }],
  ])('lets the non-macOS chord %o reach the browser', (fields) => {
    const { keys, press } = setup('other');
    const event = press(fields);
    expect(keys).toEqual([]);
    expect(event.prevented()).toBe(false);
  });

  it.each(['r', 'l', 'w'])('delivers Ctrl+%s to the application on non-macOS', (key) => {
    const { keys, press } = setup('other');
    const event = press({ key, ctrlKey: true });
    expect(keys).toEqual([{ key, ctrl: true, alt: false, shift: false }]);
    expect(event.prevented()).toBe(true);
  });

  it('delivers macOS Meta chords outside the list as alt', () => {
    const { keys, press } = setup('mac');
    press({ key: 'k', metaKey: true });
    expect(keys).toEqual([{ key: 'k', ctrl: false, alt: true, shift: false }]);
  });

  it('honors a caller-supplied pass-through predicate', () => {
    const textarea = Object.assign(createFakeTarget<WebTextEvent>(), { value: '' });
    const io = createWebInteractiveIO({ textarea, passThrough: (event) => event.key === 'q' });
    const keys: KeyInputMsg[] = [];
    io.keyInput((key) => keys.push(key));
    textarea.dispatch('keydown', withPrevent({ key: 'q' }));
    textarea.dispatch('keydown', withPrevent({ key: 'F12' }));
    expect(keys.map((key) => key.key)).toEqual(['f12']);
  });
});
