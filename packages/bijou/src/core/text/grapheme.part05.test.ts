import { describe, it, expect } from 'vitest';
import { sanitizeTerminalText } from './grapheme.js';

describe('sanitizeTerminalText', () => {
  it('removes destructive ANSI sequences and control characters', () => {
    const text = sanitizeTerminalText('A\x1b[2JB\bC\rD\tE\u0007');
    expect(text).toBe('ABC\nD  E');
  });

  it('preserves SGR styling only when explicitly allowed', () => {
    expect(sanitizeTerminalText('\x1b[31mred\x1b[0m')).toBe('red');
    expect(sanitizeTerminalText('\x1b[31mred\x1b[0m', { allowAnsiStyling: true })).toBe('\x1b[31mred\x1b[0m');
  });

  it('preserves OSC 8 hyperlinks only when explicitly allowed', () => {
    const linked = '\x1b]8;;https://example.com\x1b\\bijou\x1b]8;;\x1b\\';
    expect(sanitizeTerminalText(linked)).toBe('bijou');
    expect(sanitizeTerminalText(linked, { allowHyperlinks: true })).toBe(linked);
  });
});
