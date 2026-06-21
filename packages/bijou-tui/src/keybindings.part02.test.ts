import { describe, it, expect } from 'vitest';
import { parseKeyCombo, formatKeyCombo } from './keybindings.js';

// ---------------------------------------------------------------------------
// formatKeyCombo
// ---------------------------------------------------------------------------

describe('formatKeyCombo', () => {
  it('formats a plain key', () => {
    expect(formatKeyCombo({ key: 'q', ctrl: false, alt: false, shift: false }))
      .toBe('q');
  });

  it('formats ctrl modifier', () => {
    expect(formatKeyCombo({ key: 'c', ctrl: true, alt: false, shift: false }))
      .toBe('Ctrl+c');
  });

  it('capitalizes named keys', () => {
    expect(formatKeyCombo({ key: 'tab', ctrl: false, alt: false, shift: true }))
      .toBe('Shift+Tab');
  });

  it('formats all modifiers', () => {
    expect(formatKeyCombo({ key: 'delete', ctrl: true, alt: true, shift: false }))
      .toBe('Ctrl+Alt+Delete');
  });

  it('round-trips through parse and format', () => {
    expect(formatKeyCombo(parseKeyCombo('ctrl+shift+tab'))).toBe('Ctrl+Shift+Tab');
  });
});
