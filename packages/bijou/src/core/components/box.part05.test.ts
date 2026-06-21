import { describe, it, expect } from 'vitest';
import { box, headerBox } from './box.js';
import { createTestContext } from '../../adapters/test/index.js';
import { must } from '@flyingrobots/bijou/adapters/test';

describe('box() with fillChar', () => {
  it('renders fill character in padding areas', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = box('Hi', { fillChar: '.', padding: { left: 2, right: 2 }, ctx });
    const lines = result.split('\n');
    // Content line should have dots for padding
    const contentLine = must(lines[1]);
    expect(contentLine).toContain('..Hi..');
  });
  it('renders fill character in empty padding lines', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = box('Hi', { fillChar: '.', padding: { top: 1, bottom: 1, left: 1, right: 1 }, ctx });
    const lines = result.split('\n');
    // Top padding line (line 1) should be all dots inside border
    expect(must(lines[1])).toMatch(/│\.+│/);
  });
  it('falls back to space for wide characters', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = box('Hi', { fillChar: '漢', padding: { left: 2, right: 2 }, ctx });
    const lines = result.split('\n');
    expect(must(lines[1])).toContain('  Hi  ');
  });
  it('falls back to space for empty fillChar', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = box('Hi', { fillChar: '', padding: { left: 2, right: 2 }, ctx });
    const lines = result.split('\n');
    expect(must(lines[1])).toContain('  Hi  ');
  });
  it('passthrough in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(box('Hello', { fillChar: '.', ctx })).toBe('Hello');
  });
  it('passthrough in accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(box('Hello', { fillChar: '.', ctx })).toBe('Hello');
  });
  it('renders fill character in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = box('Hi', { fillChar: '.', padding: { left: 2, right: 2 }, ctx });
    const lines = result.split('\n');
    expect(must(lines[1])).toContain('..Hi..');
  });
  it('headerBox inherits fillChar', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = headerBox('Title', { fillChar: '.', padding: { left: 2, right: 2 }, ctx });
    const lines = result.split('\n');
    const contentLine = must(lines[1]);
    expect(contentLine).toContain('..');
  });
});
