import { describe, it, expect } from 'vitest';
import type { KeyMsg } from './types.js';
import { focusAreaKeyMap } from './focus-area.js';

function keyMsg(key: string, mods?: Partial<KeyMsg>): KeyMsg {
  return { type: 'key', key, ctrl: false, alt: false, shift: false, ...mods };
}

describe('focusAreaKeyMap', () => {
  interface Msg { type: string }

  const km = focusAreaKeyMap<Msg>({
    scrollUp: { type: 'up' },
    scrollDown: { type: 'down' },
    pageUp: { type: 'pu' },
    pageDown: { type: 'pd' },
    top: { type: 'top' },
    bottom: { type: 'bot' },
    scrollLeft: { type: 'left' },
    scrollRight: { type: 'right' },
  });

  it('handles j/k for scroll', () => {
    expect(km.handle(keyMsg('j'))).toEqual({ type: 'down' });
    expect(km.handle(keyMsg('k'))).toEqual({ type: 'up' });
  });

  it('handles page keys', () => {
    expect(km.handle(keyMsg('d'))).toEqual({ type: 'pd' });
    expect(km.handle(keyMsg('u'))).toEqual({ type: 'pu' });
  });

  it('handles top/bottom', () => {
    expect(km.handle(keyMsg('g'))).toEqual({ type: 'top' });
    expect(km.handle(keyMsg('g', { shift: true }))).toEqual({ type: 'bot' });
  });

  it('handles h/l for horizontal scroll', () => {
    expect(km.handle(keyMsg('h'))).toEqual({ type: 'left' });
    expect(km.handle(keyMsg('l'))).toEqual({ type: 'right' });
  });
  it('returns undefined for unbound keys', () => {
    expect(km.handle(keyMsg('x'))).toBeUndefined();
  });
  it('does not bind arrow keys (reserved for content navigation)', () => {
    expect(km.handle(keyMsg('up'))).toBeUndefined();
    expect(km.handle(keyMsg('down'))).toBeUndefined();
    expect(km.handle(keyMsg('left'))).toBeUndefined();
    expect(km.handle(keyMsg('right'))).toBeUndefined();
  });
});
