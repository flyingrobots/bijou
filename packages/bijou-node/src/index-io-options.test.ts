import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getDefaultContext, setDefaultContext } from '@flyingrobots/bijou';
import { _resetDefaultContextForTesting, createTestContext, mockIO } from '@flyingrobots/bijou/adapters/test';
import {
  _registerDefaultContextInitializerForTesting,
  _resetInitializedForTesting,
  initDefaultContext,
} from './index.js';
import { capturedWriter } from './io.test-support.js';

describe('initDefaultContext() IO overrides', () => {
  beforeEach(() => {
    _resetInitializedForTesting();
    _resetDefaultContextForTesting();
    _registerDefaultContextInitializerForTesting();
  });

  afterEach(() => {
    _resetInitializedForTesting();
    _resetDefaultContextForTesting();
    _registerDefaultContextInitializerForTesting();
  });

  it('treats explicit IO as a first-call override when an ambient context exists', () => {
    const existing = createTestContext({ mode: 'pipe', runtime: { columns: 40, rows: 10 } });
    const explicitIO = mockIO();
    setDefaultContext(existing);

    const ctx = initDefaultContext({ io: explicitIO });

    expect(ctx).not.toBe(existing);
    expect(getDefaultContext()).toBe(ctx);
    ctx.io.write('custom');
    expect(explicitIO.written).toEqual(['custom']);
    expect(existing.io.written).toEqual([]);
  });

  it('treats Node IO options as first-call overrides when an ambient context exists', () => {
    const existing = createTestContext({ mode: 'pipe', runtime: { columns: 40, rows: 10 } });
    const stdout = capturedWriter();
    setDefaultContext(existing);

    const ctx = initDefaultContext({ nodeIO: { stdout } });

    expect(ctx).not.toBe(existing);
    expect(getDefaultContext()).toBe(ctx);
    ctx.io.write('custom');
    expect(stdout.text()).toBe('custom');
    expect(existing.io.written).toEqual([]);
  });
});
