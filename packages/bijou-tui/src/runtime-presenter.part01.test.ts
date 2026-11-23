import { type App, createInteractiveContext, describe, expect, it, quit, run, scheduleKeys, scheduleResizes, singleCellSurface } from './runtime.test-support.js';
import { captureByteWrites, DOWN, isDirty, recordingPresenter } from './runtime-presenter.test-support.js';

/** Counter that paints one glyph while its count is above zero. */
function glyphCounterApp(): App<number> {
  return {
    init: () => [1, []],
    update(msg, model) {
      if (msg.type !== 'key') return [model, []];
      if (msg.key === 'q') return [model, [quit()]];
      if (msg.key === 'up') return [model + 1, []];
      if (msg.key === 'down') return [Math.max(0, model - 1), []];
      return [model, []];
    },
    view: (model) => (model > 0 ? singleCellSurface('X') : singleCellSurface()),
  };
}

async function runGolden() {
  const { clock, ctx } = createInteractiveContext({
    runtime: { columns: 6, rows: 2 },
  });
  const byteWrites = captureByteWrites(ctx);
  const host = recordingPresenter();
  scheduleKeys(ctx, clock, [{ at: 10, key: DOWN }, { at: 30, key: 'q' }]);
  scheduleResizes(ctx, clock, [{ at: 20, columns: 9, rows: 3 }]);
  const promise = run(glyphCounterApp(), { ctx, presenter: host.presenter });
  await clock.advanceByAsync(50);
  await promise;
  return { byteWrites, ctx, host };
}

describe('run with a SurfacePresenter', () => {
  it('delivers enter, frames, resize and exit in order', async () => {
    const { host } = await runGolden();

    expect(host.kinds()).toEqual([
      'enter',
      'present',
      'present',
      'resize',
      'present',
      'exit',
    ]);
    expect(host.events[3]).toEqual({ kind: 'resize', cols: 9, rows: 3 });
  });

  it('writes zero bytes to the context output port', async () => {
    const { byteWrites, ctx } = await runGolden();

    expect(ctx.io.written.join('')).toBe('');
    expect(byteWrites).toEqual([]);
    expect(ctx.io.writtenErr).toEqual([]);
  });

  it('presents the initial frame with the run context', async () => {
    const { ctx, host } = await runGolden();
    const initial = host.frames()[0];

    expect(initial?.ctx).toBe(ctx);
    expect([initial?.columns, initial?.rows]).toEqual([6, 2]);
    expect(initial?.currentText).toBe('');
    expect(initial?.targetText).toBe('X');
    expect(isDirty(initial?.targetDirty ?? [], 0)).toBe(true);
  });

  it('marks an erased cell through the front surface dirty bits', async () => {
    const { host } = await runGolden();
    const [initial, erase] = host.frames();

    expect(erase?.current).toBe(initial?.target);
    expect(erase?.currentText).toBe('X');
    expect(erase?.targetText).toBe('');
    expect(isDirty(erase?.currentDirty ?? [], 0)).toBe(true);
    expect(isDirty(erase?.targetDirty ?? [], 0)).toBe(false);
    expect(erase?.unmarkedChanges).toEqual([]);
  });

  it('presents a frame at the new size after a resize', async () => {
    const { host } = await runGolden();
    const resized = host.frames()[2];

    expect([resized?.columns, resized?.rows]).toEqual([9, 3]);
    expect([resized?.current.width, resized?.current.height]).toEqual([9, 3]);
    expect(resized?.unmarkedChanges).toEqual([]);
  });
});
