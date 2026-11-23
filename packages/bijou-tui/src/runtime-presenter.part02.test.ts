import { counterApp, createInteractiveContext, describe, expect, it, run, scheduleKeys, scheduleResizes } from './runtime.test-support.js';
import { captureByteWrites, UP, recordingPresenter } from './runtime-presenter.test-support.js';
import type { SurfacePresenter } from './surface-presenter.js';

describe('run with a SurfacePresenter', () => {
  it('runs a presenter that omits every optional hook', async () => {
    const targets: string[] = [];
    const presenter: SurfacePresenter = {
      present(_current, target) {
        targets.push(`${String(target.width)}x${String(target.height)}`);
      },
    };
    const { clock, ctx } = createInteractiveContext({
      runtime: { columns: 12, rows: 2 },
    });
    const byteWrites = captureByteWrites(ctx);
    scheduleKeys(ctx, clock, [{ at: 10, key: UP }, { at: 30, key: 'q' }]);
    scheduleResizes(ctx, clock, [{ at: 20, columns: 14, rows: 3 }]);

    const promise = run(counterApp(), { ctx, presenter });
    await clock.advanceByAsync(50);
    await promise;

    expect(targets).toEqual(['12x2', '12x2', '14x3']);
    expect(ctx.io.written.join('')).toBe('');
    expect(byteWrites).toEqual([]);
  });

  it('writes no mouse or screen escapes when mouse input is on', async () => {
    const host = recordingPresenter();
    const { clock, ctx } = createInteractiveContext();
    const byteWrites = captureByteWrites(ctx);
    scheduleKeys(ctx, clock, [{ at: 10, key: 'q' }]);

    const promise = run(counterApp(), {
      ctx,
      presenter: host.presenter,
      mouse: true,
      mouseMode: 'any',
      altScreen: true,
      hideCursor: true,
    });
    await clock.advanceByAsync(30);
    await promise;

    expect(host.kinds()).toEqual(['enter', 'present', 'exit']);
    expect(ctx.io.written.join('')).toBe('');
    expect(byteWrites).toEqual([]);
  });

  it('rejects without hanging when present() always throws', async () => {
    const failure = new Error('presenter lost its device');
    const exits: string[] = [];
    const presenter: SurfacePresenter = {
      present() {
        throw failure;
      },
      exit() {
        exits.push('exit');
      },
    };
    const { clock, ctx } = createInteractiveContext();
    const byteWrites = captureByteWrites(ctx);

    const outcome = run(counterApp(), { ctx, presenter }).then(
      () => 'resolved',
      (error: unknown) => error,
    );
    await clock.advanceByAsync(20);

    expect(await outcome).toBe(failure);
    expect(exits).toEqual(['exit']);
    expect(ctx.io.written.join('')).toBe('');
    expect(byteWrites).toEqual([]);
    expect(ctx.io.writtenErr.join('')).toContain('[Runtime Error]');
    expect(ctx.io.writtenErr.join('')).toContain(
      'Failed to render crash surface',
    );
  });

  it('presents the crash Surface when present() throws once', async () => {
    const failure = new Error('one bad frame');
    const host = recordingPresenter({
      present: (call) => (call === 1 ? failure : undefined),
    });
    const { presenter } = host;
    const { clock, ctx } = createInteractiveContext();
    scheduleKeys(ctx, clock, [{ at: 10, key: '\r' }]);

    const outcome = run(counterApp(), { ctx, presenter }).then(
      () => 'resolved',
      (error: unknown) => error,
    );
    await clock.advanceByAsync(30);

    expect(await outcome).toBe(failure);
    expect(host.kinds()).toEqual(['enter', 'present', 'exit']);
    expect(host.frames()[0]?.targetText).toContain('Bijou runtime crash');
    expect(host.frames()[0]?.targetText).toContain('Phase: render');
    expect(ctx.io.written.join('')).toBe('');
  });

  it('reports a throwing onResize and keeps the run alive', async () => {
    const host = recordingPresenter({
      onResize: new Error('resize refused'),
    });
    const { presenter } = host;
    const { clock, ctx } = createInteractiveContext();
    scheduleResizes(ctx, clock, [{ at: 10, columns: 20, rows: 4 }]);
    scheduleKeys(ctx, clock, [{ at: 20, key: UP }, { at: 30, key: 'q' }]);

    const promise = run(counterApp(), { ctx, presenter });
    await clock.advanceByAsync(50);
    await promise;

    expect(ctx.io.writtenErr.join('')).toContain('resize refused');
    expect(host.frames().at(-1)?.targetText).toBe('count: 1');
    expect(host.frames().at(-1)?.columns).toBe(20);
    expect(ctx.io.written.join('')).toBe('');
  });
});
