import { describe, it, expect } from 'vitest';
import { separator } from './separator.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('separator', () => {
  it('renders full-width line in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = separator({ ctx });
    expect(result).toBe('─'.repeat(80));
  });

  it('respects custom width', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = separator({ width: 40, ctx });
    expect(result).toBe('─'.repeat(40));
  });

  it('renders label centered in line', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = separator({ label: 'Test', width: 20, ctx });
    expect(result).toContain(' Test ');
    expect(result).toContain('─');
  });

  it('returns --- in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(separator({ ctx })).toBe('---');
  });

  it('returns --- Label --- in pipe mode with label', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(separator({ label: 'Section', ctx })).toBe('--- Section ---');
  });

  it('returns empty string in accessible mode without label', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(separator({ ctx })).toBe('');
  });

  it('returns --- Label --- in accessible mode with label', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(separator({ label: 'Section', ctx })).toBe('--- Section ---');
  });
});
