import { describe, it, expect } from 'vitest';
import { commandPaletteKeyMap } from './command-palette.js';

// ---------------------------------------------------------------------------
// Keymap
// ---------------------------------------------------------------------------

describe('commandPaletteKeyMap', () => {
  const actions = {
    focusNext: 'next',
    focusPrev: 'prev',
    pageDown: 'pd',
    pageUp: 'pu',
    select: 'sel',
    close: 'close',
  };
  const km = commandPaletteKeyMap(actions);

  it('dispatches down/ctrl+n to focusNext', () => {
    expect(km.handle({ type: 'key', key: 'n', ctrl: true, alt: false, shift: false })).toBe('next');
    expect(km.handle({ type: 'key', key: 'down', ctrl: false, alt: false, shift: false })).toBe('next');
  });

  it('dispatches up/ctrl+p to focusPrev', () => {
    expect(km.handle({ type: 'key', key: 'p', ctrl: true, alt: false, shift: false })).toBe('prev');
    expect(km.handle({ type: 'key', key: 'up', ctrl: false, alt: false, shift: false })).toBe('prev');
  });

  it('dispatches pagedown/ctrl+d to pageDown', () => {
    expect(km.handle({ type: 'key', key: 'd', ctrl: true, alt: false, shift: false })).toBe('pd');
    expect(km.handle({ type: 'key', key: 'pagedown', ctrl: false, alt: false, shift: false })).toBe('pd');
  });

  it('dispatches pageup/ctrl+u to pageUp', () => {
    expect(km.handle({ type: 'key', key: 'u', ctrl: true, alt: false, shift: false })).toBe('pu');
    expect(km.handle({ type: 'key', key: 'pageup', ctrl: false, alt: false, shift: false })).toBe('pu');
  });

  it('dispatches enter to select', () => {
    expect(km.handle({ type: 'key', key: 'enter', ctrl: false, alt: false, shift: false })).toBe('sel');
  });

  it('dispatches escape to close', () => {
    expect(km.handle({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false })).toBe('close');
  });
});
