import { describe, it, expect } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { subscribeFormKeyInput, isPrintableKey, isKey, handleVerticalNav } from './form-utils.js';
import { decodeRawKeyInput, decodeRawKeySequence } from '../key-input.js';

describe('semantic key input helpers', () => {
  it('decodes raw arrow and control keys', () => {
    expect(decodeRawKeyInput('\x1b[A')).toEqual({
      key: 'up',
      ctrl: false,
      alt: false,
      shift: false,
    });
    expect(decodeRawKeyInput('\x03')).toEqual({
      key: 'c',
      ctrl: true,
      alt: false,
      shift: false,
    });
  });

  it('decodes mixed raw sequences into semantic key stream', () => {
    expect(decodeRawKeySequence('ab\x1b[B\r')).toEqual([
      { key: 'a', ctrl: false, alt: false, shift: false, text: 'a' },
      { key: 'b', ctrl: false, alt: false, shift: false, text: 'b' },
      { key: 'down', ctrl: false, alt: false, shift: false },
      { key: 'enter', ctrl: false, alt: false, shift: false },
    ]);
  });

  it('subscribeFormKeyInput prefers semantic keyInput when available', async () => {
    const ctx = createTestContext({
      io: {
        keyMsgs: [
          { key: 'j', ctrl: false, alt: false, shift: false, text: 'j' },
          { key: 'enter', ctrl: false, alt: false, shift: false },
        ],
      },
    });
    const received: string[] = [];

    await new Promise<void>((resolve) => {
      const handle = subscribeFormKeyInput(ctx, (key) => {
        received.push(key.text ?? key.key);
        if (key.key === 'enter') {
          handle.dispose();
          resolve();
        }
      });
    });

    expect(received).toEqual(['j', 'enter']);
  });

  it('matches printable and modifier-aware semantic keys', () => {
    const printable = { key: '/', ctrl: false, alt: false, shift: false, text: '/' };
    const ctrlC = { key: 'c', ctrl: true, alt: false, shift: false };
    expect(isPrintableKey(printable)).toBe(true);
    expect(isKey(ctrlC, 'c', { ctrl: true })).toBe(true);
    expect(isKey(ctrlC, 'c', { ctrl: false })).toBe(false);
  });

  it('handles j/k and arrow vertical navigation', () => {
    expect(handleVerticalNav({ key: 'down', ctrl: false, alt: false, shift: false }, 0, 3)).toBe(1);
    expect(handleVerticalNav({ key: 'k', ctrl: false, alt: false, shift: false, text: 'k' }, 0, 3)).toBe(2);
  });
});
