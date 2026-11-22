import { counterApp, createInteractiveContext, createTestContext, describe, expect, it, run, scheduleKeys, scheduleResizes } from './runtime.test-support.js';
import { captureByteWrites, UP, recordingPresenter } from './runtime-presenter.test-support.js';

const LOWERED_MODES = ['static', 'pipe', 'accessible'] as const;

/** Small deterministic generator, so a failing sequence can be replayed. */
function sequence(seed: number): () => number {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1_103_515_245) + 12_345) & 0x7fffffff;
    return state;
  };
}

describe('run with a SurfacePresenter', () => {
  it.each(LOWERED_MODES)('ignores the presenter in %s mode', async (mode) => {
    const host = recordingPresenter();
    const baseline = createTestContext({ mode });
    const ctx = createTestContext({ mode });
    const byteWrites = captureByteWrites(ctx);

    await run(counterApp(), { ctx: baseline });
    await run(counterApp(), { ctx, presenter: host.presenter });

    expect(host.events).toEqual([]);
    expect(ctx.io.written.join('')).toContain('count: 0');
    expect(ctx.io.written).toEqual(baseline.io.written);
    expect(byteWrites).toEqual([]);
  });

  it('keeps framebuffers clean across 100 rapid resize and key events', async () => {
    const host = recordingPresenter();
    const next = sequence(791);
    const { clock, ctx } = createInteractiveContext({
      runtime: { columns: 16, rows: 4 },
    });
    const byteWrites = captureByteWrites(ctx);
    const keys: { at: number; key: string }[] = [];
    const resizes: { at: number; columns: number; rows: number }[] = [];
    let ups = 0;
    for (let at = 1; at <= 100; at++) {
      if (next() % 2 === 0) {
        resizes.push({ at, columns: 12 + (next() % 20), rows: 2 + (next() % 6) });
      } else {
        keys.push({ at, key: UP });
        ups += 1;
      }
    }
    keys.push({ at: 110, key: 'q' });
    scheduleKeys(ctx, clock, keys);
    scheduleResizes(ctx, clock, resizes);

    const promise = run(counterApp(), { ctx, presenter: host.presenter });
    await clock.advanceByAsync(150);
    await promise;

    const frames = host.frames();
    const last = resizes.at(-1);
    expect(host.events.filter((event) => event.kind === 'resize')).toEqual(
      resizes.map(({ columns, rows }) => ({ kind: 'resize', cols: columns, rows })),
    );
    expect(frames.length).toBeGreaterThan(50);
    expect(frames.flatMap((frame) => frame.unmarkedChanges)).toEqual([]);
    expect(frames.flatMap((frame) => frame.staleTargetBits)).toEqual([]);
    expect(frames.every((frame) =>
      frame.current.width === frame.columns
      && frame.current.height === frame.rows)).toBe(true);
    expect(frames.at(-1)?.targetText).toBe(`count: ${String(ups)}`);
    expect([frames.at(-1)?.columns, frames.at(-1)?.rows]).toEqual(
      [last?.columns, last?.rows],
    );
    expect(ctx.io.written.join('')).toBe('');
    expect(byteWrites).toEqual([]);
  });
});
