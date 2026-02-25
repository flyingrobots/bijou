import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { styled, styledStatus } from './styled.js';
import { setDefaultContext, _resetDefaultContextForTesting } from '../../context.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('styled', () => {
  afterEach(() => {
    _resetDefaultContextForTesting();
  });

  it('throws if no default context set', () => {
    _resetDefaultContextForTesting();
    expect(() => styled({ hex: '#ff0000' }, 'hi')).toThrow('[bijou] No default context configured');
  });

  it('delegates to default context style port', () => {
    const ctx = createTestContext();
    setDefaultContext(ctx);
    const result = styled({ hex: '#ff0000' }, 'hello');
    // plainStyle returns text unchanged
    expect(result).toBe('hello');
  });
});

describe('styledStatus', () => {
  beforeEach(() => {
    const ctx = createTestContext();
    setDefaultContext(ctx);
  });

  afterEach(() => {
    _resetDefaultContextForTesting();
  });

  it('resolves theme.status.success', () => {
    const result = styledStatus('success');
    expect(result).toBe('success');
  });

  it('uses the status key as label when text omitted', () => {
    const result = styledStatus('info');
    expect(result).toBe('info');
  });

  it('uses custom text when provided', () => {
    const result = styledStatus('success', 'custom label');
    expect(result).toBe('custom label');
  });

  it('falls back to muted for unknown status', () => {
    const result = styledStatus('UNKNOWN');
    // Falls back to muted token, uses 'UNKNOWN' as label
    expect(result).toBe('UNKNOWN');
  });

  it('throws if no default context set', () => {
    _resetDefaultContextForTesting();
    expect(() => styledStatus('success')).toThrow('[bijou] No default context configured');
  });
});
