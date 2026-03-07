import { describe, it, expect } from 'vitest';
import { alert } from './alert.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('alert', () => {
  it('renders box with icon in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = alert('Something happened', { variant: 'info', ctx });
    expect(result).toContain('\u2139');
    expect(result).toContain('Something happened');
    expect(result).toContain('─');
  });

  it('renders success variant with check icon', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = alert('Done!', { variant: 'success', ctx });
    expect(result).toContain('\u2713');
    expect(result).toContain('Done!');
  });

  it('returns pipe format [VARIANT] message', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(alert('fail', { variant: 'error', ctx })).toBe('[ERROR] fail');
  });

  it('returns accessible format Variant: message', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(alert('caution', { variant: 'warning', ctx })).toBe('Warning: caution');
  });

  it('defaults to info variant', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(alert('note', { ctx })).toBe('[INFO] note');
  });

  it('renders in static mode same as interactive', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = alert('msg', { variant: 'error', ctx });
    expect(result).toContain('\u2717');
    expect(result).toContain('msg');
  });

  describe('background fill', () => {
    it('applies default bg (surface.elevated) in interactive mode', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const result = alert('bg test', { ctx });
      expect(result).toContain('bg test');
      expect(result).toContain('─');
    });

    it('accepts custom bgToken', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const result = alert('custom', { bgToken: { hex: '#ffffff', bg: '#001122' }, ctx });
      expect(result).toContain('custom');
    });

    it('skips bg in pipe mode', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      const result = alert('piped', { ctx });
      expect(result).toBe('[INFO] piped');
    });

    it('skips bg in accessible mode', () => {
      const ctx = createTestContext({ mode: 'accessible' });
      const result = alert('a11y', { ctx });
      expect(result).toBe('Info: a11y');
    });

    it('skips bg when noColor is true', () => {
      const ctx = createTestContext({ mode: 'interactive', noColor: true });
      const result = alert('nocolor', { ctx });
      expect(result).toContain('nocolor');
      expect(result).toContain('─');
    });
  });

  describe('defensive input handling', () => {
    it('handles null/undefined message gracefully', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      expect(alert(null as any, { ctx })).toBe('[INFO] ');
      expect(alert(undefined as any, { ctx })).toBe('[INFO] ');
    });

    it('renders with explicit context in pipe mode', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      expect(alert('test', { ctx })).toBe('[INFO] test');
    });
  });
});
