import { describe, it, expect } from 'vitest';
import { createAnimatedProgressBar } from './progress.js';
import { createTestContext, mockClock } from '../../adapters/test/index.js';

describe('createAnimatedProgressBar', () => {
  it('start() hides cursor and renders initial bar', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const bar = createAnimatedProgressBar({ width: 10, ctx });
    bar.start();
    expect(ctx.io.written[0]).toBe('\x1b[?25l');
    expect(ctx.io.written[1]).toContain('0%');
  });

  it('update() triggers interpolation frames', () => {
    const clock = mockClock();
    const ctx = createTestContext({ mode: 'interactive', clock });
    const bar = createAnimatedProgressBar({ width: 10, fps: 30, duration: 300, ctx });
    bar.start();
    const writesBeforeUpdate = ctx.io.written.length;

    bar.update(100);

    // Advance several frames
    clock.advanceBy(200);
    expect(ctx.io.written.length).toBeGreaterThan(writesBeforeUpdate);

    // Some intermediate frames should have values between 0 and 100
    const intermediateWrites = ctx.io.written.slice(writesBeforeUpdate);
    expect(intermediateWrites.length).toBeGreaterThan(1);

    bar.stop();
  });

  it('stop() clears interval and restores cursor', () => {
    const clock = mockClock();
    const ctx = createTestContext({ mode: 'interactive', clock });
    const bar = createAnimatedProgressBar({ width: 10, ctx });
    bar.start();
    bar.update(50);
    clock.advanceBy(100);

    bar.stop('All done');
    const writes = ctx.io.written;
    expect(writes).toContain('\x1b[?25h');
    expect(writes[writes.length - 1]).toBe('All done\n');

    // No more writes after stop
    const countAfterStop = writes.length;
    clock.advanceBy(200);
    expect(writes.length).toBe(countAfterStop);
  });

  it('non-interactive mode produces static output', () => {
    const ctx = createTestContext({ mode: 'static' });
    const bar = createAnimatedProgressBar({ width: 10, ctx });
    bar.start();
    bar.update(75);
    bar.stop();

    // No cursor control sequences
    const allWrites = ctx.io.written.join('');
    expect(allWrites).not.toContain('\x1b[?25l');
    expect(allWrites).not.toContain('\x1b[?25h');
    expect(ctx.io.written[0]).toContain('0%');
    expect(ctx.io.written[0]).toMatch(/\n$/);
    expect(ctx.io.written[1]).toContain('75%');
    expect(ctx.io.written[1]).toMatch(/\n$/);
  });

  it('animation converges to target value', () => {
    const clock = mockClock();
    const ctx = createTestContext({ mode: 'interactive', clock });
    const bar = createAnimatedProgressBar({ width: 10, fps: 30, duration: 300, ctx });
    bar.start();
    bar.update(100);

    // Advance enough time for animation to complete
    clock.advanceBy(500);

    const lastRenderWrite = ctx.io.written.filter(w => w.includes('%')).at(-1);
    expect(lastRenderWrite).toContain('100%');

    bar.stop();
  });

  it('falls back to default fps and duration for non-finite animation options', () => {
    const clock = mockClock();
    const ctx = createTestContext({ mode: 'interactive', clock });
    const bar = createAnimatedProgressBar({
      fps: Number.POSITIVE_INFINITY,
      duration: Number.NaN,
      ctx,
    });

    bar.start();
    const writesBeforeUpdate = ctx.io.written.length;
    bar.update(100);
    clock.advanceBy(40);

    expect(ctx.io.written.length).toBeGreaterThan(writesBeforeUpdate);
    bar.stop();
  });
});
