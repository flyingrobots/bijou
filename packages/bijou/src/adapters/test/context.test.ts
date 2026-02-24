import { describe, it, expect } from 'vitest';
import { createTestContext } from './index.js';

describe('createTestContext()', () => {
  it('returns BijouContext with all fields', () => {
    const ctx = createTestContext();
    expect(ctx.runtime.env).toBeTypeOf('function');
    expect(ctx.io.write).toBeTypeOf('function');
    expect(ctx.style.bold).toBeTypeOf('function');
    expect(ctx.theme.noColor).toBeTypeOf('boolean');
    expect(typeof ctx.mode).toBe('string');
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

  it('forwards runtime options', () => {
    const ctx = createTestContext({ runtime: { columns: 120 } });
    expect(ctx.runtime.columns).toBe(120);
  });

  it('forwards io options', async () => {
    const ctx = createTestContext({ io: { answers: ['yes'] } });
    expect(await ctx.io.question('? ')).toBe('yes');
  });
});
