import { describe, it, expect } from 'vitest';
import { filePickerKeyMap } from './file-picker.js';
import type { KeyMsg } from './types.js';

function keyMsg(key: string, mods?: Partial<KeyMsg>): KeyMsg {
  return { type: 'key', key, ctrl: false, alt: false, shift: false, ...mods };
}

// ── keymap ────────────────────────────────────────────────────────

describe('filePickerKeyMap', () => {
  const actions = {
    focusNext: 'next' as const,
    focusPrev: 'prev' as const,
    enter: 'enter' as const,
    back: 'back' as const,
    quit: 'quit' as const,
  };

  const km = filePickerKeyMap(actions);

  it('handles j/k for navigation', () => {
    expect(km.handle(keyMsg('j'))).toBe('next');
    expect(km.handle(keyMsg('k'))).toBe('prev');
  });

  it('handles arrow keys', () => {
    expect(km.handle(keyMsg('down'))).toBe('next');
    expect(km.handle(keyMsg('up'))).toBe('prev');
  });

  it('handles enter for directory entry', () => {
    expect(km.handle(keyMsg('enter'))).toBe('enter');
  });

  it('handles backspace and left for parent directory', () => {
    expect(km.handle(keyMsg('backspace'))).toBe('back');
    expect(km.handle(keyMsg('left'))).toBe('back');
  });

  it('handles quit', () => {
    expect(km.handle(keyMsg('q'))).toBe('quit');
    expect(km.handle(keyMsg('c', { ctrl: true }))).toBe('quit');
  });

  it('returns undefined for unbound keys', () => {
    expect(km.handle(keyMsg('x'))).toBeUndefined();
  });
});
