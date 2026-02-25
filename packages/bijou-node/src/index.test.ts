import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createNodeContext, initDefaultContext, _resetInitializedForTesting } from './index.js';
import { getDefaultContext, _resetDefaultContextForTesting } from '@flyingrobots/bijou';

describe('createNodeContext()', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns BijouContext with all five fields', () => {
    const ctx = createNodeContext();
    expect(ctx.theme).toBeDefined();
    expect(ctx.mode).toBeDefined();
    expect(ctx.runtime).toBeDefined();
    expect(ctx.io).toBeDefined();
    expect(ctx.style).toBeDefined();
  });

  it('theme is resolved with a name', () => {
    const ctx = createNodeContext();
    expect(typeof ctx.theme.theme.name).toBe('string');
    expect(typeof ctx.theme.noColor).toBe('boolean');
  });

  it('mode is a valid OutputMode', () => {
    const ctx = createNodeContext();
    expect(['interactive', 'static', 'pipe', 'accessible']).toContain(ctx.mode);
  });

  it('runtime reads process.env', () => {
    vi.stubEnv('__BIJOU_TEST_CTX__', 'test-value');
    const ctx = createNodeContext();
    expect(ctx.runtime.env('__BIJOU_TEST_CTX__')).toBe('test-value');
  });

  it('respects NO_COLOR env var', () => {
    vi.stubEnv('NO_COLOR', '1');
    const ctx = createNodeContext();
    expect(ctx.theme.noColor).toBe(true);
  });
});

describe('initDefaultContext()', () => {
  beforeEach(() => {
    _resetInitializedForTesting();
    _resetDefaultContextForTesting();
  });

  afterEach(() => {
    _resetInitializedForTesting();
    _resetDefaultContextForTesting();
  });

  it('first call returns a BijouContext with all five fields', () => {
    const ctx = initDefaultContext();
    expect(ctx.theme).toBeDefined();
    expect(ctx.mode).toBeDefined();
    expect(ctx.runtime).toBeDefined();
    expect(ctx.io).toBeDefined();
    expect(ctx.style).toBeDefined();
  });

  it('first call sets the default context', () => {
    const ctx = initDefaultContext();
    expect(getDefaultContext()).toBe(ctx);
  });

  it('subsequent call returns a new context without overwriting the default', () => {
    const first = initDefaultContext();
    const second = initDefaultContext();
    expect(second).not.toBe(first);
    expect(getDefaultContext()).toBe(first);
  });
});
