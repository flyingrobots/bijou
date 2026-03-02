import { describe, it, expect } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import {
  formatFormTitle,
  writeValidationError,
  renderNumberedOptions,
  terminalRenderer,
  formDispatch,
} from './form-utils.js';

/** Join all writes into a single string for substring assertions. */
function allWritten(ctx: { io: { written: string[] } }): string {
  return ctx.io.written.join('');
}

describe('formatFormTitle', () => {
  it('returns plain title when noColor: true', () => {
    const ctx = createTestContext({ noColor: true });
    expect(formatFormTitle('Name', ctx)).toBe('Name');
  });

  it('returns plain title when mode: accessible', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(formatFormTitle('Name', ctx)).toBe('Name');
  });

  it('returns styled ? title in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = formatFormTitle('Name', ctx);
    expect(result).toContain('?');
    expect(result).toContain('Name');
  });

  it('handles empty string title', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = formatFormTitle('', ctx);
    expect(result).toContain('?');
  });
});

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

describe('terminalRenderer', () => {
  it('hideCursor writes hide sequence', () => {
    const ctx = createTestContext();
    const term = terminalRenderer(ctx);
    term.hideCursor();
    expect(allWritten(ctx)).toContain('\x1b[?25l');
  });

  it('showCursor writes show sequence', () => {
    const ctx = createTestContext();
    const term = terminalRenderer(ctx);
    term.showCursor();
    expect(allWritten(ctx)).toContain('\x1b[?25h');
  });

  it('writeLine writes clear-line + text + newline', () => {
    const ctx = createTestContext();
    const term = terminalRenderer(ctx);
    term.writeLine('hello');
    const output = allWritten(ctx);
    expect(output).toContain('\r\x1b[K');
    expect(output).toContain('hello\n');
  });

  it('moveUp writes move-up sequence', () => {
    const ctx = createTestContext();
    const term = terminalRenderer(ctx);
    term.moveUp(3);
    expect(allWritten(ctx)).toContain('\x1b[3A');
  });

  it('clearBlock clears N lines then moves up', () => {
    const ctx = createTestContext();
    const term = terminalRenderer(ctx);
    term.clearBlock(3);
    const output = allWritten(ctx);
    // Should write 3x clear-to-end + newline, then move up 3
    const clearCount = (output.match(/\x1b\[K\n/g) ?? []).length;
    expect(clearCount).toBe(3);
    expect(output).toContain('\x1b[3A');
  });
});

describe('formDispatch', () => {
  it('calls interactive handler when mode=interactive and stdinIsTTY=true', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { stdinIsTTY: true } });
    const result = await formDispatch(
      ctx,
      async () => 'interactive',
      async () => 'fallback',
    );
    expect(result).toBe('interactive');
  });

  it('calls fallback handler when mode=interactive but stdinIsTTY=false', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { stdinIsTTY: false } });
    const result = await formDispatch(
      ctx,
      async () => 'interactive',
      async () => 'fallback',
    );
    expect(result).toBe('fallback');
  });

  it('calls fallback handler when mode=pipe', async () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = await formDispatch(
      ctx,
      async () => 'interactive',
      async () => 'fallback',
    );
    expect(result).toBe('fallback');
  });

  it('calls fallback handler when mode=accessible', async () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const result = await formDispatch(
      ctx,
      async () => 'interactive',
      async () => 'fallback',
    );
    expect(result).toBe('fallback');
  });

  it('calls fallback handler when mode=static', async () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = await formDispatch(
      ctx,
      async () => 'interactive',
      async () => 'fallback',
    );
    expect(result).toBe('fallback');
  });
});
