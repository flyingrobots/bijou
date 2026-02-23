import { describe, it, expect } from 'vitest';
import { box, headerBox } from './box.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('box', () => {
  it('renders box in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = box('Hello World', { ctx });
    expect(result).toContain('Hello World');
    expect(result).toContain('─'); // border chars
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

describe('headerBox', () => {
  it('renders header box with detail in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = headerBox('Title', { detail: 'some detail', ctx });
    expect(result).toContain('Title');
    expect(result).toContain('some detail');
  });

  it('renders pipe format', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(headerBox('Title', { detail: 'detail', ctx })).toBe('Title  detail');
  });

  it('renders accessible format', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(headerBox('Title', { detail: 'detail', ctx })).toBe('Title: detail');
  });

  it('renders label only when no detail', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(headerBox('Title', { ctx })).toBe('Title');
  });
});
