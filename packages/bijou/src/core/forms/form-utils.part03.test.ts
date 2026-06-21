import { describe, it, expect } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { renderNumberedOptions } from './form-utils.js';

function allWritten(ctx: { io: { written: string[] } }): string {
  return ctx.io.written.join('');
}

describe('renderNumberedOptions', () => {
  it('renders numbered list with labels', () => {
    const ctx = createTestContext();
    renderNumberedOptions([{ label: 'Alpha' }, { label: 'Beta' }], ctx);
    const output = allWritten(ctx);
    expect(output).toContain('1. Alpha');
    expect(output).toContain('2. Beta');
  });

  it('includes descriptions when present', () => {
    const ctx = createTestContext();
    renderNumberedOptions([{ label: 'Alpha', description: 'First' }], ctx);
    expect(allWritten(ctx)).toContain('Alpha \u2014 First');
  });

  it('omits description suffix when description is undefined', () => {
    const ctx = createTestContext();
    renderNumberedOptions([{ label: 'Alpha' }], ctx);
    expect(allWritten(ctx)).not.toContain('\u2014');
  });

  it('handles empty array (writes nothing)', () => {
    const ctx = createTestContext();
    renderNumberedOptions([], ctx);
    expect(ctx.io.written).toHaveLength(0);
  });
});
