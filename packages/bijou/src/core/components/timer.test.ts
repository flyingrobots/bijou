import { describe, it, expect } from 'vitest';
import { timer, createTimer, createStopwatch } from './timer.js';
import { createTestContext, mockClock } from '../../adapters/test/index.js';

describe('timer (static)', () => {
  it('formats MM:SS in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(timer(150_000, { ctx })).toBe('02:30');
  });

  it('formats HH:MM:SS when showHours is true', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(timer(3_723_000, { showHours: true, ctx })).toBe('01:02:03');
  });

  it('auto-shows hours when >= 1 hour', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(timer(3_600_000, { ctx })).toBe('01:00:00');
  });

  it('formats with milliseconds when showMs is true', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(timer(150_456, { showMs: true, ctx })).toBe('02:30.456');
  });

  it('formats pipe mode as plain text', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(timer(150_000, { ctx })).toBe('02:30');
  });

  it('formats accessible mode as spoken text', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(timer(150_000, { ctx })).toBe('2 minutes, 30 seconds');
  });

  it('includes label in output', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(timer(150_000, { label: 'Time:', ctx })).toBe('Time: 02:30');
  });

  it('formats zero milliseconds', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(timer(0, { ctx })).toBe('0 seconds');
  });

  it('handles singular units in spoken mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(timer(3_661_000, { ctx })).toBe('1 hour, 1 minute, 1 second');
  });

  it('handles negative ms gracefully', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(timer(-1000, { ctx })).toBe('00:00');
  });

  it('handles negative ms with showMs', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(timer(-500, { showMs: true, ctx })).toBe('00:00.000');
  });
});

describe('createTimer', () => {
  it('emits a single line in non-interactive mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const t = createTimer({ duration: 60_000, ctx });
    t.start();
    expect(ctx.io.written.length).toBe(1);
    expect(ctx.io.written[0]).toContain('01:00');
    t.stop();
  });

  it('hides cursor on start in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const t = createTimer({ duration: 60_000, ctx });
    t.start();
    expect(ctx.io.written[0]).toBe('\x1b[?25l');
    t.stop();
  });

  it('restores cursor on stop in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const t = createTimer({ duration: 60_000, ctx });
    t.start();
    t.stop();
    const output = ctx.io.written.join('');
    expect(output).toContain('\x1b[?25h');
  });

  it('restores cursor on natural completion in interactive mode', () => {
    const clock = mockClock();
    const ctx = createTestContext({ mode: 'interactive', clock });
    let completed = false;
    const t = createTimer({ duration: 1000, interval: 100, ctx, onComplete: () => { completed = true; } });
    t.start();
    clock.advanceBy(1100);
    const output = ctx.io.written.join('');
    expect(completed).toBe(true);
    expect(output).toContain('\x1b[?25h');
  });

  it('fires onComplete after cursor is restored on natural completion', () => {
    const clock = mockClock();
    const ctx = createTestContext({ mode: 'interactive', clock });
    let cursorRestoredBeforeCallback = false;
    const t = createTimer({
      duration: 1000, interval: 100, ctx,
      onComplete: () => {
        // At the time onComplete fires, cursor should already be restored
        const output = ctx.io.written.join('');
        cursorRestoredBeforeCallback = output.endsWith('\x1b[?25h');
      },
    });
    t.start();
    clock.advanceBy(1100);
    expect(cursorRestoredBeforeCallback).toBe(true);
  });

  it('fires onComplete in non-interactive mode for zero-duration timer', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    let completed = false;
    const t = createTimer({ duration: 0, ctx, onComplete: () => { completed = true; } });
    t.start();
    expect(completed).toBe(true);
  });

  it('completes immediately in interactive mode when duration is 0', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    let completed = false;
    const t = createTimer({ duration: 0, ctx, onComplete: () => { completed = true; } });
    t.start();
    expect(completed).toBe(true);
  });

  it('writes final message on stop', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const t = createTimer({ duration: 60_000, ctx });
    t.start();
    t.stop('Done!');
    const output = ctx.io.written.join('');
    expect(output).toContain('Done!');
  });

  it('elapsed starts at 0', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const t = createTimer({ duration: 60_000, ctx });
    expect(t.elapsed()).toBe(0);
  });

  it('displays countdown value that decreases over time', () => {
    const clock = mockClock();
    const ctx = createTestContext({ mode: 'interactive', clock });
    const t = createTimer({ duration: 60_000, interval: 1000, ctx });
    t.start();
    clock.advanceBy(30_000);
    const output = ctx.io.written.join('');
    // Should contain a value showing ~30s remaining
    expect(output).toContain('00:30');
    t.stop();
  });
});

describe('createStopwatch', () => {
  it('emits a single line in non-interactive mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const sw = createStopwatch({ ctx });
    sw.start();
    expect(ctx.io.written.length).toBe(1);
    expect(ctx.io.written[0]).toContain('00:00');
    sw.stop();
  });

  it('hides cursor on start in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const sw = createStopwatch({ ctx });
    sw.start();
    expect(ctx.io.written[0]).toBe('\x1b[?25l');
    sw.stop();
  });

  it('elapsed starts at 0', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const sw = createStopwatch({ ctx });
    expect(sw.elapsed()).toBe(0);
  });

  it('calling start() twice does not leak interval handles', () => {
    const clock = mockClock();
    const ctx = createTestContext({ mode: 'interactive', clock });
    const sw = createStopwatch({ interval: 100, ctx });
    sw.start();

    // Start again — should cancel the first interval
    sw.start();
    clock.advanceBy(500);
    sw.stop();

    // Count tick writes (those containing CLEAR_LINE_RETURN = \r\x1b[K)
    const tickWrites = ctx.io.written.filter((s: string) => s.includes('\r\x1b[K'));
    // 2 initial renders (one per start) + 5 ticks (500ms / 100ms) = 7
    // With a leak we'd see ~12+ from both intervals running
    expect(tickWrites.length).toBeGreaterThanOrEqual(5);
    expect(tickWrites.length).toBeLessThanOrEqual(8);
  });

  it('elapsed() returns a live value while running', () => {
    const clock = mockClock();
    const ctx = createTestContext({ mode: 'interactive', clock });
    const sw = createStopwatch({ interval: 1000, ctx });
    sw.start();
    clock.advanceBy(500);
    // Between ticks, elapsed() should still reflect real time
    expect(sw.elapsed()).toBeGreaterThanOrEqual(500);
    sw.stop();
  });

  it('pause and resume preserve elapsed', () => {
    const clock = mockClock();
    const ctx = createTestContext({ mode: 'interactive', clock });
    const sw = createStopwatch({ interval: 100, ctx });
    sw.start();
    clock.advanceBy(300);
    sw.pause();
    const atPause = sw.elapsed();
    expect(atPause).toBeGreaterThanOrEqual(300);
    // Time passes while paused — elapsed should NOT advance
    clock.advanceBy(500);
    expect(sw.elapsed()).toBe(atPause);
    // Resume and verify elapsed advances again
    sw.resume();
    clock.advanceBy(200);
    expect(sw.elapsed()).toBeGreaterThanOrEqual(atPause + 200);
    sw.stop();
  });

  it('start() while paused resets paused state', () => {
    const clock = mockClock();
    const ctx = createTestContext({ mode: 'interactive', clock });
    const sw = createStopwatch({ interval: 100, ctx });
    sw.start();
    clock.advanceBy(200);
    sw.pause();
    // Restart while paused — should not remain frozen
    sw.start();
    clock.advanceBy(300);
    expect(sw.elapsed()).toBeGreaterThanOrEqual(300);
    sw.stop();
  });

  it('stop() snapshots accurate elapsed value', () => {
    const clock = mockClock();
    const ctx = createTestContext({ mode: 'interactive', clock });
    const sw = createStopwatch({ interval: 1000, ctx });
    sw.start();
    clock.advanceBy(550);
    sw.stop();
    // elapsed() after stop should reflect time at stop, not last tick
    expect(sw.elapsed()).toBeGreaterThanOrEqual(550);
  });

  it('stop() after pause() preserves paused elapsed value', () => {
    const clock = mockClock();
    const ctx = createTestContext({ mode: 'interactive', clock });
    const sw = createStopwatch({ interval: 100, ctx });
    sw.start();
    clock.advanceBy(400);
    sw.pause();
    const atPause = sw.elapsed();
    expect(atPause).toBeGreaterThanOrEqual(400);
    // Stop while paused — elapsed should reflect time at pause
    sw.stop();
    expect(sw.elapsed()).toBe(atPause);
  });
});
