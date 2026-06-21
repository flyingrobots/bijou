import { describe, it, expect } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { createBoldFn } from './form-utils.js';
import { auditStyle } from '../../adapters/test/audit-style.js';

describe('createBoldFn', () => {
  it('returns identity function when noColor is true', () => {
    const ctx = createTestContext({ noColor: true });
    const boldFn = createBoldFn(ctx);
    expect(boldFn('hello')).toBe('hello');
  });

  it('calls ctx.style.bold when noColor is false', () => {
    const style = auditStyle();
    const ctx = createTestContext({ noColor: false });
    const ctxWithAudit = { ...ctx, style };
    const boldFn = createBoldFn(ctxWithAudit);
    boldFn('hello');
    expect(style.calls.some((c) => c.method === 'bold' && c.text === 'hello')).toBe(true);
  });

  it('does not call bold() when noColor is true', () => {
    const style = auditStyle();
    const ctx = createTestContext({ noColor: true });
    const ctxWithAudit = { ...ctx, style };
    const boldFn = createBoldFn(ctxWithAudit);
    boldFn('hello');
    expect(style.calls).toHaveLength(0);
  });
});
