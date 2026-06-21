import { describe, it, expect } from 'vitest';
import { sanitizePlainTerminalText } from './grapheme.js';

describe('sanitizePlainTerminalText', () => {
  it('flattens multiline untrusted text by default', () => {
    expect(sanitizePlainTerminalText('A\nB\tC')).toBe('A B  C');
  });

  it('preserves newlines only when explicitly requested', () => {
    expect(sanitizePlainTerminalText('A\r\nB\tC', { preserveNewlines: true })).toBe('A\nB  C');
  });

  it('drops mixed DCS and BEL payloads before plain-text cell writes', () => {
    expect(sanitizePlainTerminalText('A\x1bPshadow\x1b\\B\u0007C')).toBe('ABC');
  });
});
