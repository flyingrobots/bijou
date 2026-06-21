import { describe, it, expect } from 'vitest';
import type { KeyMsg } from './types.js';
import { dagPaneKeyMap } from './dag-pane.js';

function keyMsg(key: string, mods?: Partial<KeyMsg>): KeyMsg {
  return { type: 'key', key, ctrl: false, alt: false, shift: false, ...mods };
}

// ── Keymap ──────────────────────────────────────────────────────────
describe('dagPaneKeyMap', () => {
  interface Msg { type: string }
  const km = dagPaneKeyMap<Msg>({
    selectParent: { type: 'parent' },
    selectChild: { type: 'child' },
    selectLeft: { type: 'left' },
    selectRight: { type: 'right' },
    scrollUp: { type: 'up' },
    scrollDown: { type: 'down' },
    scrollLeft: { type: 'sleft' },
    scrollRight: { type: 'sright' },
    pageUp: { type: 'pu' },
    pageDown: { type: 'pd' },
    top: { type: 'top' },
    bottom: { type: 'bot' },
    confirm: { type: 'ok' },
    quit: { type: 'quit' },
  });
  it('handles arrow keys for node selection', () => {
    expect(km.handle(keyMsg('up'))).toEqual({ type: 'parent' });
    expect(km.handle(keyMsg('down'))).toEqual({ type: 'child' });
    expect(km.handle(keyMsg('left'))).toEqual({ type: 'left' });
    expect(km.handle(keyMsg('right'))).toEqual({ type: 'right' });
  });
  it('handles j/k for scroll', () => {
    expect(km.handle(keyMsg('j'))).toEqual({ type: 'down' });
    expect(km.handle(keyMsg('k'))).toEqual({ type: 'up' });
  });
  it('handles h/l for horizontal scroll', () => {
    expect(km.handle(keyMsg('h'))).toEqual({ type: 'sleft' });
    expect(km.handle(keyMsg('l'))).toEqual({ type: 'sright' });
  });
  it('handles page keys', () => {
    expect(km.handle(keyMsg('d'))).toEqual({ type: 'pd' });
    expect(km.handle(keyMsg('u'))).toEqual({ type: 'pu' });
  });
  it('handles top/bottom', () => {
    expect(km.handle(keyMsg('g'))).toEqual({ type: 'top' });
    expect(km.handle(keyMsg('g', { shift: true }))).toEqual({ type: 'bot' });
  });
  it('handles enter for confirm', () => {
    expect(km.handle(keyMsg('enter'))).toEqual({ type: 'ok' });
  });
  it('handles quit', () => {
    expect(km.handle(keyMsg('q'))).toEqual({ type: 'quit' });
    expect(km.handle(keyMsg('c', { ctrl: true }))).toEqual({ type: 'quit' });
  });
  it('returns undefined for unbound keys', () => {
    expect(km.handle(keyMsg('x'))).toBeUndefined();
  });
});
