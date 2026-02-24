import { describe, it, expect, beforeEach } from 'vitest';
import { getDefaultContext, setDefaultContext, _resetDefaultContextForTesting } from './context.js';
import { createTestContext } from './adapters/test/index.js';

describe('default context', () => {
  beforeEach(() => {
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
    expect(() => getDefaultContext()).toThrow();
  });
});
