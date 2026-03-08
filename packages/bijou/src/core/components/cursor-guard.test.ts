import { describe, it, expect } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { cursorGuard, withHiddenCursor } from './cursor-guard.js';

describe('cursorGuard', () => {
  it('hides cursor on first hide() and shows on dispose()', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const guard = cursorGuard(ctx.io);
    const handle = guard.hide();

    expect(ctx.io.written.join('')).toContain('\x1b[?25l');

    handle.dispose();
    expect(ctx.io.written.join('')).toContain('\x1b[?25h');
  });

  it('only shows cursor when all handles are disposed (reference counting)', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const guard = cursorGuard(ctx.io);

    const h1 = guard.hide();
    const h2 = guard.hide();

    // Only one hide sequence despite two calls
    const output1 = ctx.io.written.join('');
    expect(output1.split('\x1b[?25l').length - 1).toBe(1);

    // Disposing h1 does NOT show cursor — h2 still holds
    h1.dispose();
    const output2 = ctx.io.written.join('');
    expect(output2).not.toContain('\x1b[?25h');

    // Disposing h2 shows cursor — count reaches 0
    h2.dispose();
    const output3 = ctx.io.written.join('');
    expect(output3).toContain('\x1b[?25h');
  });

  it('dispose() is idempotent — double-dispose does not double-show', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const guard = cursorGuard(ctx.io);

    const handle = guard.hide();
    handle.dispose();
    handle.dispose(); // second dispose — should be no-op

    const shows = ctx.io.written.join('').split('\x1b[?25h').length - 1;
    expect(shows).toBe(1);
  });

  it('can re-hide after fully releasing', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const guard = cursorGuard(ctx.io);

    const h1 = guard.hide();
    h1.dispose();

    const h2 = guard.hide();
    h2.dispose();

    const output = ctx.io.written.join('');
    const hides = output.split('\x1b[?25l').length - 1;
    const shows = output.split('\x1b[?25h').length - 1;
    expect(hides).toBe(2);
    expect(shows).toBe(2);
  });

  it('returns the same guard for the same IOPort', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const g1 = cursorGuard(ctx.io);
    const g2 = cursorGuard(ctx.io);
    expect(g1).toBe(g2);
  });

  it('returns different guards for different IOPorts', () => {
    const ctx1 = createTestContext({ mode: 'interactive' });
    const ctx2 = createTestContext({ mode: 'interactive' });
    const g1 = cursorGuard(ctx1.io);
    const g2 = cursorGuard(ctx2.io);
    expect(g1).not.toBe(g2);
  });

  it('depth is readable', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const guard = cursorGuard(ctx.io);

    expect(guard.depth).toBe(0);
    const h1 = guard.hide();
    expect(guard.depth).toBe(1);
    const h2 = guard.hide();
    expect(guard.depth).toBe(2);
    h1.dispose();
    expect(guard.depth).toBe(1);
    h2.dispose();
    expect(guard.depth).toBe(0);
  });
});

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
      withHiddenCursor(ctx.io, () => {
        throw new Error('boom');
      });
    }).toThrow('boom');

    expect(ctx.io.written.join('')).toContain('\x1b[?25h');
  });

  it('returns the value from fn', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = withHiddenCursor(ctx.io, () => 42);
    expect(result).toBe(42);
  });

  it('works with async fn', async () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = await withHiddenCursor(ctx.io, async () => {
      return 'async-value';
    });
    expect(result).toBe('async-value');
    expect(ctx.io.written.join('')).toContain('\x1b[?25h');
  });

  it('shows cursor after async fn rejects', async () => {
    const ctx = createTestContext({ mode: 'interactive' });
    await expect(
      withHiddenCursor(ctx.io, async () => {
        throw new Error('async-boom');
      }),
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

      // Inner done, but outer still holds — cursor should still be hidden
      expect(guard.depth).toBe(1);
      const output = ctx.io.written.join('');
      const shows = output.split('\x1b[?25h').length - 1;
      expect(shows).toBe(0);
    });

    // Both done — cursor shown
    expect(guard.depth).toBe(0);
    expect(ctx.io.written.join('')).toContain('\x1b[?25h');
  });
});
