import { describe, it, expect } from 'vitest';
import { createTimer } from './timer.js';
import { createTestContext, mockClock } from '../../adapters/test/index.js';

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
