import { describe, it, expect } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { createStyledFn } from './form-utils.js';
import { auditStyle } from '../../adapters/test/audit-style.js';

describe('createStyledFn', () => {
  it('returns identity function when noColor is true', () => {
    const ctx = createTestContext({ noColor: true });
    const styledFn = createStyledFn(ctx);
    const result = styledFn(ctx.semantic('info'), 'hello');
    expect(result).toBe('hello');
  });

  it('calls ctx.style.styled when noColor is false', () => {
    const style = auditStyle();
    const ctx = createTestContext({ noColor: false });
    // Replace style with audit style to track calls
    const ctxWithAudit = { ...ctx, style };
    const styledFn = createStyledFn(ctxWithAudit);
    styledFn(ctx.semantic('info'), 'hello');
    expect(style.wasStyled(ctx.semantic('info'), 'hello')).toBe(true);
  });

  it('does not call styled() when noColor is true', () => {
    const style = auditStyle();
    const ctx = createTestContext({ noColor: true });
    const ctxWithAudit = { ...ctx, style };
    const styledFn = createStyledFn(ctxWithAudit);
    styledFn(ctx.semantic('info'), 'hello');
    expect(style.calls).toHaveLength(0);
  });
});
