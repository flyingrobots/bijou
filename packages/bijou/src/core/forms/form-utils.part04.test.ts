import { describe, it, expect } from 'vitest';
import { createTestContext, expectHiddenCursor, expectShownCursor } from '../../adapters/test/index.js';
import { terminalRenderer } from './form-utils.js';

function allWritten(ctx: { io: { written: string[] } }): string {
  return ctx.io.written.join('');
}

describe('terminalRenderer', () => {
  it('hideCursor writes hide sequence', () => {
    const ctx = createTestContext();
    const term = terminalRenderer(ctx);
    term.hideCursor();
    expectHiddenCursor(allWritten(ctx));
  });

  it('showCursor writes show sequence', () => {
    const ctx = createTestContext();
    const term = terminalRenderer(ctx);
    term.hideCursor();
    term.showCursor();
    expectShownCursor(allWritten(ctx));
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
    const clearCount = output.split('\x1b[K\n').length - 1;
    expect(clearCount).toBe(3);
    expect(output).toContain('\x1b[3A');
  });
});
