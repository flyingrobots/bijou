import { describe, it, expect } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { formDispatch } from './form-utils.js';

const interactiveResult = () => Promise.resolve('interactive'), fallbackResult = () => Promise.resolve('fallback');

describe('formDispatch', () => {
  it('calls interactive handler when mode=interactive and stdinIsTTY=true', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { stdinIsTTY: true } });
    const result = await formDispatch(
      ctx,
      interactiveResult,
      fallbackResult,
    );
    expect(result).toBe('interactive');
  });

  it('calls fallback handler when mode=interactive but stdinIsTTY=false', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { stdinIsTTY: false } });
    const result = await formDispatch(
      ctx,
      interactiveResult,
      fallbackResult,
    );
    expect(result).toBe('fallback');
  });

  it('calls fallback handler when mode=pipe', async () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = await formDispatch(
      ctx,
      interactiveResult,
      fallbackResult,
    );
    expect(result).toBe('fallback');
  });

  it('calls fallback handler when mode=accessible', async () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const result = await formDispatch(
      ctx,
      interactiveResult,
      fallbackResult,
    );
    expect(result).toBe('fallback');
  });

  it('calls fallback handler when mode=static', async () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = await formDispatch(
      ctx,
      interactiveResult,
      fallbackResult,
    );
    expect(result).toBe('fallback');
  });
});
