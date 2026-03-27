import { describe, it, expect } from 'vitest';
import { createTestContext, expectHiddenCursor, expectShownCursor } from '../../adapters/test/index.js';
import {
  formatFormTitle,
  writeValidationError,
  renderNumberedOptions,
  terminalRenderer,
  formDispatch,
  createStyledFn,
  createBoldFn,
  subscribeFormKeyInput,
  isPrintableKey,
  isKey,
  handleVerticalNav,
} from './form-utils.js';
import { decodeRawKeyInput, decodeRawKeySequence } from '../key-input.js';
import { auditStyle } from '../../adapters/test/audit-style.js';

/** Join all writes into a single string for substring assertions. */
function allWritten(ctx: { io: { written: string[] } }): string {
  return ctx.io.written.join('');
}

describe('formatFormTitle', () => {
  it('returns ? title when noColor: true', () => {
    const ctx = createTestContext({ noColor: true });
    expect(formatFormTitle('Name', ctx)).toBe('? Name');
  });

  it('returns ? title when mode: accessible', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(formatFormTitle('Name', ctx)).toBe('? Name');
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

describe('semantic key input helpers', () => {
  it('decodes raw arrow and control keys', () => {
    expect(decodeRawKeyInput('\x1b[A')).toEqual({
      key: 'up',
      ctrl: false,
      alt: false,
      shift: false,
    });
    expect(decodeRawKeyInput('\x03')).toEqual({
      key: 'c',
      ctrl: true,
      alt: false,
      shift: false,
    });
  });

  it('decodes mixed raw sequences into semantic key stream', () => {
    expect(decodeRawKeySequence('ab\x1b[B\r')).toEqual([
      { key: 'a', ctrl: false, alt: false, shift: false, text: 'a' },
      { key: 'b', ctrl: false, alt: false, shift: false, text: 'b' },
      { key: 'down', ctrl: false, alt: false, shift: false },
      { key: 'enter', ctrl: false, alt: false, shift: false },
    ]);
  });

  it('subscribeFormKeyInput prefers semantic keyInput when available', async () => {
    const ctx = createTestContext({
      io: {
        keyMsgs: [
          { key: 'j', ctrl: false, alt: false, shift: false, text: 'j' },
          { key: 'enter', ctrl: false, alt: false, shift: false },
        ],
      },
    });
    const received: string[] = [];

    await new Promise<void>((resolve) => {
      const handle = subscribeFormKeyInput(ctx, (key) => {
        received.push(key.text ?? key.key);
        if (key.key === 'enter') {
          handle.dispose();
          resolve();
        }
      });
    });

    expect(received).toEqual(['j', 'enter']);
  });

  it('matches printable and modifier-aware semantic keys', () => {
    const printable = { key: '/', ctrl: false, alt: false, shift: false, text: '/' };
    const ctrlC = { key: 'c', ctrl: true, alt: false, shift: false };
    expect(isPrintableKey(printable)).toBe(true);
    expect(isKey(ctrlC, 'c', { ctrl: true })).toBe(true);
    expect(isKey(ctrlC, 'c', { ctrl: false })).toBe(false);
  });

  it('handles j/k and arrow vertical navigation', () => {
    expect(handleVerticalNav({ key: 'down', ctrl: false, alt: false, shift: false }, 0, 3)).toBe(1);
    expect(handleVerticalNav({ key: 'k', ctrl: false, alt: false, shift: false, text: 'k' }, 0, 3)).toBe(2);
  });
});
