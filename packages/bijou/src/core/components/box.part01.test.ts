import { describe, it, expect } from 'vitest';
import { box } from './box.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('box', () => {
  it('renders box in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = box('Hello World', { ctx });
    expect(result).toContain('Hello World');
    expect(result).toContain('─');
  });
  it('returns content only in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(box('Hello World', { ctx })).toBe('Hello World');
  });
  it('returns content only in accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(box('Hello World', { ctx })).toBe('Hello World');
  });
});
