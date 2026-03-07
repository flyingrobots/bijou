import { describe, it, expect } from 'vitest';
import { kbd } from './kbd.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('kbd', () => {
  it('renders bracketed key in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = kbd('Ctrl+C', { ctx });
    expect(result).toBe('[ Ctrl+C ]');
  });

  it('renders in static mode same as interactive', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = kbd('Enter', { ctx });
    expect(result).toBe('[ Enter ]');
  });

  it('returns angle-bracketed key in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(kbd('Esc', { ctx })).toBe('<Esc>');
  });

  it('returns plain key in accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(kbd('Tab', { ctx })).toBe('Tab');
  });

  it('handles multi-word keys', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(kbd('Shift+Alt+F', { ctx })).toBe('[ Shift+Alt+F ]');
  });

  describe('background fill', () => {
    it('applies default bg (surface.muted) in interactive mode', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const result = kbd('Enter', { ctx });
      expect(result).toContain('Enter');
      expect(result).toContain('[');
      expect(result).toContain(']');
    });

    it('accepts custom bgToken', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const result = kbd('Tab', { bgToken: { hex: '#ffffff', bg: '#001122' }, ctx });
      expect(result).toContain('Tab');
    });

    it('skips bg in pipe mode', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      expect(kbd('Esc', { ctx })).toBe('<Esc>');
    });

    it('skips bg in accessible mode', () => {
      const ctx = createTestContext({ mode: 'accessible' });
      expect(kbd('Tab', { ctx })).toBe('Tab');
    });

    it('skips bg when noColor is true', () => {
      const ctx = createTestContext({ mode: 'interactive', noColor: true });
      const result = kbd('Enter', { ctx });
      expect(result).toContain('Enter');
    });
  });
});
