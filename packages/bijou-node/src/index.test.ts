import { describe, it, expect, afterEach, vi } from 'vitest';
import { createNodeContext } from './index.js';

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
});
