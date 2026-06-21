import { describe, it, expect } from 'vitest';
import { parseKeyCombo } from './keybindings.js';

// ---------------------------------------------------------------------------
// parseKeyCombo
// ---------------------------------------------------------------------------

describe('parseKeyCombo', () => {
  it('parses a plain key', () => {
    expect(parseKeyCombo('q')).toEqual({
      key: 'q', ctrl: false, alt: false, shift: false,
    });
  });

  it('parses ctrl modifier', () => {
    expect(parseKeyCombo('ctrl+c')).toEqual({
      key: 'c', ctrl: true, alt: false, shift: false,
    });
  });

  it('parses alt modifier', () => {
    expect(parseKeyCombo('alt+x')).toEqual({
      key: 'x', ctrl: false, alt: true, shift: false,
    });
  });

  it('parses shift modifier', () => {
    expect(parseKeyCombo('shift+tab')).toEqual({
      key: 'tab', ctrl: false, alt: false, shift: true,
    });
  });

  it('parses multiple modifiers', () => {
    expect(parseKeyCombo('ctrl+alt+delete')).toEqual({
      key: 'delete', ctrl: true, alt: true, shift: false,
    });
  });

  it('is case-insensitive', () => {
    expect(parseKeyCombo('Ctrl+C')).toEqual({
      key: 'c', ctrl: true, alt: false, shift: false,
    });
  });

  it('throws on unknown modifier', () => {
    expect(() => parseKeyCombo('meta+x')).toThrow('Unknown modifier "meta"');
  });

  it('throws on empty key', () => {
    expect(() => parseKeyCombo('ctrl+')).toThrow('Empty key');
  });

  it('parses named keys', () => {
    expect(parseKeyCombo('enter')).toEqual({
      key: 'enter', ctrl: false, alt: false, shift: false,
    });
    expect(parseKeyCombo('space')).toEqual({
      key: 'space', ctrl: false, alt: false, shift: false,
    });
    expect(parseKeyCombo('escape')).toEqual({
      key: 'escape', ctrl: false, alt: false, shift: false,
    });
  });

  it('parses plus as a plain key instead of a modifier separator', () => {
    expect(parseKeyCombo('+')).toEqual({
      key: '+', ctrl: false, alt: false, shift: false,
    });
  });
});
