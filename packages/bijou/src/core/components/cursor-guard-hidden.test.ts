import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { cursorGuard, withHiddenCursor } from './cursor-guard.js';

describe('withHiddenCursor', () => {
  it('hides cursor before fn and shows after', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    let cursorWasHidden = false;

    withHiddenCursor(ctx.io, () => {
      cursorWasHidden = ctx.io.written.join('').includes('\x1b[?25l');
    });

    expect(cursorWasHidden).toBe(true);
    expect(ctx.io.written.join('')).toContain('\x1b[?25h');
  });

  it('shows cursor even when fn throws', () => {
    const ctx = createTestContext({ mode: 'interactive' });

    expect(() => {
      void withHiddenCursor(ctx.io, () => {
        throw new Error('x');
      });
    }).toThrow('x');

    expect(ctx.io.written.join('')).toContain('\x1b[?25h');
  });

  it('returns sync and async values from fn', async () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(withHiddenCursor(ctx.io, () => 42)).toBe(42);
    await expect(withHiddenCursor(ctx.io, () => Promise.resolve('async-value'))).resolves.toBe('async-value');
    expect(ctx.io.written.join('')).toContain('\x1b[?25h');
  });

  it('shows cursor after async fn rejects', async () => {
    const ctx = createTestContext({ mode: 'interactive' });
    await expect(
      withHiddenCursor(ctx.io, () => Promise.reject(new Error('async-boom'))),
    ).rejects.toThrow('async-boom');

    expect(ctx.io.written.join('')).toContain('\x1b[?25h');
  });

  it('nests correctly with the shared guard', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const guard = cursorGuard(ctx.io);

    withHiddenCursor(ctx.io, () => {
      expect(guard.depth).toBe(1);
      withHiddenCursor(ctx.io, () => {
        expect(guard.depth).toBe(2);
      });
      expect(guard.depth).toBe(1);
      const shows = ctx.io.written.join('').split('\x1b[?25h').length - 1;
      expect(shows).toBe(0);
    });

    expect(guard.depth).toBe(0);
    expect(ctx.io.written.join('')).toContain('\x1b[?25h');
  });
});
