import { describe, it, expect, vi, afterEach } from 'vitest';
import { timer, createTimer, createStopwatch } from './timer.js';
import { createTestContext } from '../../adapters/test/index.js';

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
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    vi.useFakeTimers();
    try {
      const ctx = createTestContext({ mode: 'interactive' });
      let completed = false;
      const t = createTimer({ duration: 1000, interval: 100, ctx, onComplete: () => { completed = true; } });
      t.start();
      vi.advanceTimersByTime(1100);
      const output = ctx.io.written.join('');
      expect(completed).toBe(true);
      expect(output).toContain('\x1b[?25h');
    } finally {
      vi.useRealTimers();
    }
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
});

describe('createStopwatch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('pause and resume preserve elapsed', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const sw = createStopwatch({ ctx });
    sw.start();
    // Simulate some passage of time
    sw.pause();
    const elapsed = sw.elapsed();
    sw.resume();
    // After resume, elapsed should be >= the paused value
    expect(sw.elapsed()).toBeGreaterThanOrEqual(elapsed);
    sw.stop();
  });
});
