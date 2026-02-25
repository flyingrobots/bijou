import { describe, it, expect } from 'vitest';
import { paginator } from './paginator.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('paginator', () => {
  it('renders dots in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = paginator({ current: 1, total: 4, ctx });
    expect(result).toBe('○ ● ○ ○');
  });

  it('renders dots in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = paginator({ current: 0, total: 3, ctx });
    expect(result).toBe('● ○ ○');
  });

  it('renders text style in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = paginator({ current: 1, total: 4, style: 'text', ctx });
    expect(result).toBe('Page 2 of 4');
  });

  it('renders compact format in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = paginator({ current: 1, total: 4, ctx });
    expect(result).toBe('[2/4]');
  });

  it('renders descriptive text in accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const result = paginator({ current: 2, total: 5, ctx });
    expect(result).toBe('Page 3 of 5');
  });

  it('handles first page', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = paginator({ current: 0, total: 1, ctx });
    expect(result).toBe('●');
  });

  it('pipe mode ignores style option', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = paginator({ current: 0, total: 3, style: 'dots', ctx });
    expect(result).toBe('[1/3]');
  });
});
