import { describe, it, expect } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { writeValidationError } from './form-utils.js';

function allWritten(ctx: { io: { written: string[] } }): string {
  return ctx.io.written.join('');
}

describe('writeValidationError', () => {
  it('writes plain message + newline when noColor: true', () => {
    const ctx = createTestContext({ noColor: true });
    writeValidationError('Required field', ctx);
    expect(allWritten(ctx)).toContain('Required field\n');
  });

  it('writes plain message when mode: accessible', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    writeValidationError('Required field', ctx);
    expect(allWritten(ctx)).toContain('Required field\n');
  });

  it('writes styled message with semantic.error when color enabled', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    writeValidationError('Bad input', ctx);
    const output = allWritten(ctx);
    expect(output).toContain('Bad input');
    expect(output).toContain('\n');
  });
});
