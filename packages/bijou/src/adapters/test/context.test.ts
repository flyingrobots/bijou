import { describe, it, expect } from 'vitest';
import { createTestContext } from './index.js';

describe('createTestContext()', () => {
  it('returns BijouContext with all fields', () => {
    const ctx = createTestContext();
    expect(ctx.theme).toBeDefined();
    expect(ctx.mode).toBeDefined();
    expect(ctx.runtime).toBeDefined();
    expect(ctx.io).toBeDefined();
    expect(ctx.style).toBeDefined();
  });

  it('defaults to interactive mode', () => {
    expect(createTestContext().mode).toBe('interactive');
  });

  it('uses specified mode', () => {
    expect(createTestContext({ mode: 'pipe' }).mode).toBe('pipe');
    expect(createTestContext({ mode: 'accessible' }).mode).toBe('accessible');
  });

  it('theme is resolved with noColor false by default', () => {
    expect(createTestContext().theme.noColor).toBe(false);
  });

  it('theme respects noColor option', () => {
    expect(createTestContext({ noColor: true }).theme.noColor).toBe(true);
  });

  it('io is a MockIO with written buffer and answer queue', () => {
    const ctx = createTestContext();
    ctx.io.write('test');
    expect(ctx.io.written).toEqual(['test']);
  });
});
