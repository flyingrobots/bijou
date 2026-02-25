import { describe, it, expect, vi } from 'vitest';
import { progressBar, createProgressBar, createAnimatedProgressBar } from './progress.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('progressBar', () => {
  it('renders progress bar at 0% in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = progressBar(0, { width: 10, ctx });
    expect(result).toContain('0%');
    expect(result).not.toContain('[');
    expect(result).not.toContain(']');
  });

  it('renders progress bar at 100% in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = progressBar(100, { width: 10, ctx });
    expect(result).toContain('100%');
    expect(result).toContain('██████████');
  });

  it('renders progress bar at 50% in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = progressBar(50, { width: 10, ctx });
    expect(result).toContain('50%');
    expect(result).toContain('█████');
    expect(result).toContain('⠐⠐⠐⠐⠐');
  });

  it('clamps below 0', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = progressBar(-10, { width: 10, ctx });
    expect(result).toContain('0%');
  });

  it('clamps above 100', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = progressBar(150, { width: 10, ctx });
    expect(result).toContain('100%');
  });

  it('hides percent when showPercent is false', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = progressBar(50, { width: 10, showPercent: false, ctx });
    expect(result).not.toContain('%');
  });

  it('returns pipe format in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = progressBar(45, { ctx });
    expect(result).toBe('Progress: 45%');
  });

  it('returns accessible format in accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const result = progressBar(45, { ctx });
    expect(result).toBe('45 percent complete.');
  });

  it('uses custom filled and empty characters', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = progressBar(50, { width: 4, filled: '#', empty: '-', ctx });
    expect(result).toContain('##--');
  });
});

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
    expect(updateWrite).toMatch(/^\r\x1b\[K/);
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

describe('createAnimatedProgressBar', () => {
  it('start() hides cursor and renders initial bar', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const bar = createAnimatedProgressBar({ width: 10, ctx });
    bar.start();
    expect(ctx.io.written[0]).toBe('\x1b[?25l');
    expect(ctx.io.written[1]).toContain('0%');
  });

  it('update() triggers interpolation frames', async () => {
    vi.useFakeTimers();
    const ctx = createTestContext({ mode: 'interactive' });
    const bar = createAnimatedProgressBar({ width: 10, fps: 30, duration: 300, ctx });
    bar.start();
    const writesBeforeUpdate = ctx.io.written.length;

    bar.update(100);

    // Advance several frames
    vi.advanceTimersByTime(200);
    expect(ctx.io.written.length).toBeGreaterThan(writesBeforeUpdate);

    // Some intermediate frames should have values between 0 and 100
    const intermediateWrites = ctx.io.written.slice(writesBeforeUpdate);
    expect(intermediateWrites.length).toBeGreaterThan(1);

    bar.stop();
    vi.useRealTimers();
  });

  it('stop() clears interval and restores cursor', () => {
    vi.useFakeTimers();
    const ctx = createTestContext({ mode: 'interactive' });
    const bar = createAnimatedProgressBar({ width: 10, ctx });
    bar.start();
    bar.update(50);
    vi.advanceTimersByTime(100);

    bar.stop('All done');
    const writes = ctx.io.written;
    expect(writes).toContain('\x1b[?25h');
    expect(writes[writes.length - 1]).toBe('All done\n');

    // No more writes after stop
    const countAfterStop = writes.length;
    vi.advanceTimersByTime(200);
    expect(writes.length).toBe(countAfterStop);

    vi.useRealTimers();
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
    vi.useFakeTimers();
    const ctx = createTestContext({ mode: 'interactive' });
    const bar = createAnimatedProgressBar({ width: 10, fps: 30, duration: 300, ctx });
    bar.start();
    bar.update(100);

    // Advance enough time for animation to complete
    vi.advanceTimersByTime(500);

    const lastRenderWrite = ctx.io.written.filter(w => w.includes('%')).at(-1);
    expect(lastRenderWrite).toContain('100%');

    bar.stop();
    vi.useRealTimers();
  });
});
