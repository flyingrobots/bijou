import { describe, it, expect } from 'vitest';
import { badge } from './badge.js';
import { createTestContext } from '../../adapters/test/index.js';
import { surfaceToString } from '../render/differ.js';

describe('badge', () => {
  it('renders padded text in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = surfaceToString(badge('OK', { ctx }), ctx.style);
    expect(result).toContain('OK');
  });

  it('renders with variant in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = surfaceToString(badge('Error', { variant: 'error', ctx }), ctx.style);
    expect(result).toContain('Error');
  });

  it('returns bracketed text in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = surfaceToString(badge('Done', { ctx }), ctx.style);
    expect(result).toBe('[Done]');
  });

  it('returns plain text in accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const result = surfaceToString(badge('Info', { ctx }), ctx.style);
    expect(result).toContain('Info');
  });

  it('defaults to info variant', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = surfaceToString(badge('Note', { ctx }), ctx.style);
    expect(result).toContain('Note');
  });
});
