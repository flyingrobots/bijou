import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDefaultContext, setDefaultContext, _resetDefaultContextForTesting } from './context.js';
import { createTestContext } from './adapters/test/index.js';
import { confirm } from './core/forms/confirm.js';

describe('default context', () => {
  beforeEach(() => {
    _resetDefaultContextForTesting();
  });

  afterEach(() => {
    _resetDefaultContextForTesting();
  });

  it('getDefaultContext() throws before setDefaultContext()', () => {
    expect(() => getDefaultContext()).toThrow('[bijou] No default context configured');
  });

  it('setDefaultContext() makes context available via getDefaultContext()', () => {
    const ctx = createTestContext();
    setDefaultContext(ctx);
    expect(getDefaultContext()).toBe(ctx);
  });

  it('setDefaultContext() overwrites previous context', () => {
    const ctx1 = createTestContext({ mode: 'interactive' });
    const ctx2 = createTestContext({ mode: 'pipe' });
    setDefaultContext(ctx1);
    setDefaultContext(ctx2);
    expect(getDefaultContext()).toBe(ctx2);
  });

  it('_resetDefaultContextForTesting() clears the singleton', () => {
    setDefaultContext(createTestContext());
    _resetDefaultContextForTesting();
    expect(() => getDefaultContext()).toThrow('[bijou] No default context configured');
  });

  it('components use default context when ctx omitted', async () => {
    const ctx = createTestContext({ mode: 'pipe', io: { answers: ['y'] } });
    setDefaultContext(ctx);
    const result = await confirm({ title: 'OK?' });
    expect(result).toBe(true);
    expect(ctx.io.written.length).toBeGreaterThan(0);
  });
});
