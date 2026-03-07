import { describe, it, expect } from 'vitest';
import { breadcrumb } from './breadcrumb.js';
import { createTestContext } from '../../adapters/test/index.js';

const items = ['Home', 'Settings', 'Profile'];

describe('breadcrumb', () => {
  it('renders last item as current in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = breadcrumb(items, { ctx });
    expect(result).toContain('Home');
    expect(result).toContain('Settings');
    expect(result).toContain('Profile');
    expect(result).toContain('›');
  });

  it('renders with separator in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = breadcrumb(items, { ctx });
    expect(result).toContain('›');
    expect(result).toContain('Profile');
  });

  it('renders plain text with > in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = breadcrumb(items, { ctx });
    expect(result).toBe('Home > Settings > Profile');
  });

  it('renders descriptive text in accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const result = breadcrumb(items, { ctx });
    expect(result).toBe('Breadcrumb: Home > Settings > Profile (current)');
  });

  it('supports custom separator', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = breadcrumb(items, { separator: ' / ', ctx });
    expect(result).toBe('Home / Settings / Profile');
  });

  it('handles single item', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = breadcrumb(['Home'], { ctx });
    expect(result).toBe('Home');
  });

  it('handles two items', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = breadcrumb(['Home', 'About'], { ctx });
    expect(result).toBe('Home > About');
  });

  describe('background fill', () => {
    it('applies currentBgToken on last segment', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const result = breadcrumb(items, { currentBgToken: { hex: '#ffffff', bg: '#001122' }, ctx });
      expect(result).toContain('Profile');
      expect(result).toContain('›');
    });

    it('no default bg (opt-in only)', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const result = breadcrumb(items, { ctx });
      expect(result).toContain('Profile');
    });

    it('skips currentBgToken in pipe mode', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      const result = breadcrumb(items, { currentBgToken: { hex: '#ffffff', bg: '#001122' }, ctx });
      expect(result).toBe('Home > Settings > Profile');
    });

    it('skips currentBgToken when noColor is true', () => {
      const ctx = createTestContext({ mode: 'interactive', noColor: true });
      const result = breadcrumb(items, { currentBgToken: { hex: '#ffffff', bg: '#001122' }, ctx });
      expect(result).toContain('Profile');
    });
  });
});
