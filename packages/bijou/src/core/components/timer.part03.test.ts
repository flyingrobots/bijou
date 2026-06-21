import { describe, it, expect } from 'vitest';
import { createStopwatch } from './timer.js';
import { createTestContext, mockClock } from '../../adapters/test/index.js';

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
