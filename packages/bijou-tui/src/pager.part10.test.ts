import { describe, it, expect } from 'vitest';
import { pagerKeyMap } from './pager.js';
import type { KeyMsg } from './types.js';

function keyMsg(key: string, mods?: Partial<KeyMsg>): KeyMsg {
  return { type: 'key', key, ctrl: false, alt: false, shift: false, ...mods };
}

// ── Keymap ──────────────────────────────────────────────────────────

describe('pagerKeyMap', () => {
  interface Msg { type: string }

  const km = pagerKeyMap<Msg>({
    scrollUp: { type: 'up' },
    scrollDown: { type: 'down' },
    pageUp: { type: 'pu' },
    pageDown: { type: 'pd' },
    top: { type: 'top' },
    bottom: { type: 'bot' },
    quit: { type: 'quit' },
  });

  it('handles j/k for scroll', () => {
    expect(km.handle(keyMsg('j'))).toEqual({ type: 'down' });
    expect(km.handle(keyMsg('k'))).toEqual({ type: 'up' });
  });

  it('handles arrow keys', () => {
    expect(km.handle(keyMsg('down'))).toEqual({ type: 'down' });
    expect(km.handle(keyMsg('up'))).toEqual({ type: 'up' });
  });

  it('handles page keys', () => {
    expect(km.handle(keyMsg('d'))).toEqual({ type: 'pd' });
    expect(km.handle(keyMsg('u'))).toEqual({ type: 'pu' });
  });

  it('handles top/bottom', () => {
    expect(km.handle(keyMsg('g'))).toEqual({ type: 'top' });
    expect(km.handle(keyMsg('g', { shift: true }))).toEqual({ type: 'bot' });
  });
  it('handles quit', () => {
    expect(km.handle(keyMsg('q'))).toEqual({ type: 'quit' });
    expect(km.handle(keyMsg('c', { ctrl: true }))).toEqual({ type: 'quit' });
  });
  it('returns undefined for unbound keys', () => {
    expect(km.handle(keyMsg('x'))).toBeUndefined();
  });
});
