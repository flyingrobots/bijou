import { describe, it, expect } from 'vitest';
import { headerBox } from './box.js';
import { createTestContext } from '../../adapters/test/index.js';

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
