import { describe, it, expect } from 'vitest';
import { badge } from './badge.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('badge', () => {
  it('renders padded text in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = badge('OK', { ctx });
    expect(result).toBe(' OK ');
  });

  it('renders with variant in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = badge('Error', { variant: 'error', ctx });
    expect(result).toBe(' Error ');
  });

  it('returns bracketed text in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(badge('Done', { ctx })).toBe('[Done]');
  });

  it('returns plain text in accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(badge('Info', { ctx })).toBe('Info');
  });

  it('defaults to info variant', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = badge('Note', { ctx });
    expect(result).toBe(' Note ');
  });
});
