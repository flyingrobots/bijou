import { describe, it, expect } from 'vitest';
import { createProgressBar } from './progress.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('createProgressBar', () => {
  it('start() hides cursor and writes initial bar in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const bar = createProgressBar({ width: 10, ctx });
    bar.start();
    expect(ctx.io.written[0]).toBe('\x1b[?25l');
    expect(ctx.io.written[1]).toContain('0%');
  });

  it('update() overwrites line in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const bar = createProgressBar({ width: 10, ctx });
    bar.start();
    bar.update(50);
    const updateWrite = ctx.io.written[2];
    expect(updateWrite).toMatch(new RegExp(`^\\r${String.fromCharCode(27)}\\[K`, 'u'));
    expect(updateWrite).toContain('50%');
  });

  it('stop() restores cursor and writes final message', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const bar = createProgressBar({ width: 10, ctx });
    bar.start();
    bar.stop('Done!');
    const writes = ctx.io.written;
    expect(writes).toContain('\x1b[?25h');
    expect(writes[writes.length - 1]).toBe('Done!\n');
  });

  it('stop() without final message still restores cursor', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const bar = createProgressBar({ width: 10, ctx });
    bar.start();
    bar.stop();
    expect(ctx.io.written).toContain('\x1b[?25h');
    expect(ctx.io.written.at(-1)).toBe('\x1b[?25h');
  });

  it('non-interactive mode prints lines instead of overwriting', () => {
    const ctx = createTestContext({ mode: 'static' });
    const bar = createProgressBar({ width: 10, ctx });
    bar.start();
    bar.update(50);
    bar.stop('Complete');
    // Each write should end with newline (no cursor control)
    expect(ctx.io.written[0]).toContain('0%');
    expect(ctx.io.written[0]).toMatch(/\n$/);
    expect(ctx.io.written[1]).toContain('50%');
    expect(ctx.io.written[1]).toMatch(/\n$/);
    expect(ctx.io.written[2]).toBe('Complete\n');
  });
});
