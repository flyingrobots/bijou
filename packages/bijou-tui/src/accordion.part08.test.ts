import { describe, it, expect } from 'vitest';
import { accordionKeyMap } from './accordion.js';
import type { KeyMsg } from './types.js';

function keyMsg(key: string, mods?: Partial<KeyMsg>): KeyMsg {
  return { type: 'key', key, ctrl: false, alt: false, shift: false, ...mods };
}

describe('accordionKeyMap', () => {
  interface Msg { type: string }
  const km = accordionKeyMap<Msg>({
    focusNext: { type: 'next' },
    focusPrev: { type: 'prev' },
    toggle: { type: 'toggle' },
    quit: { type: 'quit' },
  });
  it('handles j/k for navigation', () => {
    expect(km.handle(keyMsg('j'))).toEqual({ type: 'next' });
    expect(km.handle(keyMsg('k'))).toEqual({ type: 'prev' });
  });
  it('handles arrow keys', () => {
    expect(km.handle(keyMsg('down'))).toEqual({ type: 'next' });
    expect(km.handle(keyMsg('up'))).toEqual({ type: 'prev' });
  });
  it('handles enter/space for toggle', () => {
    expect(km.handle(keyMsg('enter'))).toEqual({ type: 'toggle' });
    expect(km.handle(keyMsg('space'))).toEqual({ type: 'toggle' });
  });
  it('handles quit', () => {
    expect(km.handle(keyMsg('q'))).toEqual({ type: 'quit' });
    expect(km.handle(keyMsg('c', { ctrl: true }))).toEqual({ type: 'quit' });
  });
  it('returns undefined for unbound keys', () => {
    expect(km.handle(keyMsg('x'))).toBeUndefined();
  });
});
