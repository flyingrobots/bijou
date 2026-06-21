import { describe, it, expect } from 'vitest';
import { box } from './box.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('box() with bgToken', () => {
  const bgToken = { hex: '#ffffff', bg: '#1e1e2e' };
  it('applies bg fill in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = box('Hello', { bgToken, ctx });
    expect(result).toContain('Hello');
    expect(result).toContain('─');
  });
  it('applies bg fill in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = box('Hello', { bgToken, ctx });
    expect(result).toContain('Hello');
    expect(result).toContain('─');
  });
  it('skips bg fill in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = box('Hello', { bgToken, ctx });
    expect(result).toBe('Hello');
  });
  it('skips bg fill in accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const result = box('Hello', { bgToken, ctx });
    expect(result).toBe('Hello');
  });
  it('skips bg fill when noColor is true', () => {
    const ctx = createTestContext({ mode: 'interactive', noColor: true });
    const result = box('Hello', { bgToken, ctx });
    expect(result).toContain('Hello');
    expect(result).toContain('─');
  });
  it('is a no-op when bgToken has no bg field', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const token = { hex: '#ffffff' };
    const result = box('Hello', { bgToken: token, ctx });
    expect(result).toContain('Hello');
    expect(result).toContain('─');
  });
});
