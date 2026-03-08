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

  it('theme accessor functions are resolved and functional', () => {
    const ctx = createTestContext();
    expect(ctx.semantic('primary').hex).toBeTypeOf('string');
    expect(ctx.status('success').hex).toBeTypeOf('string');
    expect(ctx.border('primary').hex).toBeTypeOf('string');
    expect(ctx.surface('primary').hex).toBeTypeOf('string');
    expect(ctx.ui('cursor').hex).toBeTypeOf('string');
    const brandGradient = ctx.gradient('brand');
    expect(Array.isArray(brandGradient)).toBe(true);
    expect(brandGradient.length).toBeGreaterThan(0);
    expect(brandGradient).toEqual(ctx.theme.theme.gradient['brand']);
  });

  it('status() falls back to muted for unknown keys', () => {
    const ctx = createTestContext();
    const muted = ctx.status('muted');
    const unknown = ctx.status('nonexistent');
    expect(unknown.hex).toBe(muted.hex);
  });

  it('gradient() returns empty array for unknown keys', () => {
    const ctx = createTestContext();
    expect(ctx.gradient('nonexistent')).toEqual([]);
  });

});
