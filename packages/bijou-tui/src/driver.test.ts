import { describe, it, expect } from 'vitest';
import { runScript } from './driver.js';
import type { App, Cmd, MouseMsg } from './types.js';
import { quit } from './commands.js';
import { isKeyMsg, isResizeMsg } from './types.js';
import { badge, surfaceToString } from '@flyingrobots/bijou';
import { createTestContext, mockClock, plainStyle } from '@flyingrobots/bijou/adapters/test';

const style = plainStyle();

// ---------------------------------------------------------------------------
// Test app: counter that increments on 'up', decrements on 'down', quits on 'q'
// ---------------------------------------------------------------------------

interface CounterModel {
  count: number;
}

const counterApp: App<CounterModel> = {
  init() {
    return [{ count: 0 }, []];
  },
  update(msg, model) {
    if (isKeyMsg(msg)) {
      if (msg.key === 'up') return [{ count: model.count + 1 }, []];
      if (msg.key === 'down') return [{ count: model.count - 1 }, []];
      if (msg.key === 'q') return [model, [quit()]];
    }
    return [model, []];
  },
  view(model) {
    return `Count: ${model.count}`;
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('runScript', () => {
  it('captures initial frame', async () => {
    const result = await runScript(counterApp, []);
    expect(result.frames).toHaveLength(1);
    expect(surfaceToString(result.frames[0]!, style)).toContain('Count: 0');
    expect(result.model.count).toBe(0);
  });

  it('processes key steps and captures frames', async () => {
    const result = await runScript(counterApp, [
      { key: '\x1b[A' }, // up
      { key: '\x1b[A' }, // up
      { key: '\x1b[B' }, // down
    ]);
    // Initial frame + 3 update frames
    expect(result.frames).toHaveLength(4);
    expect(result.model.count).toBe(1);
    expect(surfaceToString(result.frames[1]!, style)).toContain('Count: 1');
    expect(surfaceToString(result.frames[2]!, style)).toContain('Count: 2');
    expect(surfaceToString(result.frames[3]!, style)).toContain('Count: 1');
  });

  it('stops on quit signal', async () => {
    const result = await runScript(counterApp, [
      { key: '\x1b[A' }, // up
      { key: 'q' },      // quit
      { key: '\x1b[A' }, // should not be processed
    ]);
    expect(result.model.count).toBe(1);
  });

  it('calls onFrame callback', async () => {
    const captured: Array<{ frame: string; index: number }> = [];
    await runScript(counterApp, [{ key: '\x1b[A' }], {
      onFrame(frame, index) {
        captured.push({ frame: surfaceToString(frame, style), index });
      },
    });
    expect(captured).toHaveLength(2); // initial + 1 update
    expect(captured[0]!.index).toBe(0);
    expect(captured[1]!.index).toBe(1);
  });

  it('supports delays between steps', async () => {
    const clock = mockClock({ nowMs: 1_000 });
    const ctx = createTestContext({ clock });
    const promise = runScript(counterApp, [
      { key: '\x1b[A', delay: 50 },
      { key: '\x1b[A', delay: 50 },
    ], { ctx, pulseFps: false });
    for (let i = 0; i < 4; i++) {
      await clock.advanceByAsync(25);
    }
    const result = await promise;
    expect(result.elapsed).toBe(100);
    expect(result.model.count).toBe(2);
  });

  it('works with app that has init commands', async () => {
    type Msg = { type: 'loaded'; data: string };
    interface Model { data: string; loaded: boolean }

    const app: App<Model, Msg> = {
      init(): [Model, Cmd<Msg>[]] {
        const cmd: Cmd<Msg> = async () => ({ type: 'loaded' as const, data: 'hello' });
        return [{ data: '', loaded: false }, [cmd]];
      },
      update(msg, model) {
        if ('data' in msg && (msg as Msg).type === 'loaded') {
          return [{ data: (msg as Msg).data, loaded: true }, []];
        }
        return [model, []];
      },
      view(model) {
        return model.loaded ? `Data: ${model.data}` : 'Loading...';
      },
    };

    const result = await runScript(app, []);
    // Init command should have settled and updated the model
    expect(result.model.loaded).toBe(true);
    expect(result.model.data).toBe('hello');
  });

  it('handles empty steps array', async () => {
    const result = await runScript(counterApp, []);
    expect(result.frames).toHaveLength(1);
    expect(result.model.count).toBe(0);
    expect(result.elapsed).toBeGreaterThanOrEqual(0);
  });

  it('emits resize steps', async () => {
    interface Model { cols: number; rows: number }
    const app: App<Model> = {
      init: () => [{ cols: 80, rows: 24 }, []],
      update(msg, model) {
        if (isResizeMsg(msg)) {
          return [{ cols: msg.columns, rows: msg.rows }, []];
        }
        return [model, []];
      },
      view(model) {
        return `${model.cols}x${model.rows}`;
      },
    };

    const result = await runScript(app, [{ resize: { columns: 120, rows: 40 } }]);
    expect(result.model.cols).toBe(120);
    expect(result.model.rows).toBe(40);
    expect(surfaceToString(result.frames[result.frames.length - 1]!, style)).toContain('120x40');
  });

  it('uses the latest scripted dimensions when normalizing legacy string views', async () => {
    const result = await runScript(counterApp, [
      { resize: { columns: 18, rows: 3 } },
    ]);

    const lastFrame = result.frames[result.frames.length - 1]!;
    expect(lastFrame.width).toBe(18);
    expect(lastFrame.height).toBe(3);
  });

  it('emits custom msg steps', async () => {
    type Msg = { type: 'inc' };
    interface Model { count: number }
    const app: App<Model, Msg> = {
      init: () => [{ count: 0 }, []],
      update(msg, model) {
        if ((msg as Msg).type === 'inc') return [{ count: model.count + 1 }, []];
        return [model, []];
      },
      view(model) {
        return `Count: ${model.count}`;
      },
    };

    const result = await runScript(app, [{ msg: { type: 'inc' } }, { msg: { type: 'inc' } }]);
    expect(result.model.count).toBe(2);
  });

  it('emits mouse steps', async () => {
    interface Model { clicked: number }
    type Msg = MouseMsg;
    const app: App<Model, Msg> = {
      init: () => [{ clicked: 0 }, []],
      update(msg, model) {
        if (msg.type === 'mouse' && msg.action === 'press' && msg.button === 'left') {
          return [{ clicked: model.clicked + 1 }, []];
        }
        return [model, []];
      },
      view(model) {
        return `Clicked: ${model.clicked}`;
      },
    };

    const result = await runScript(app, [{
      mouse: {
        type: 'mouse',
        button: 'left',
        action: 'press',
        col: 4,
        row: 2,
        shift: false,
        alt: false,
        ctrl: false,
      },
    }]);

    expect(result.model.clicked).toBe(1);
  });

  it('installs the BCSS resolver when css is provided', async () => {
    const ctx = createTestContext({
      runtime: { columns: 40, rows: 8 },
    });

    const app: App<null> = {
      init: () => [null, []],
      update: (_msg, model) => [model, []],
      view: () => badge('Styled', { class: 'active', ctx }),
    };

    const result = await runScript(app, [], {
      ctx,
      css: `
        .active {
          color: #001122;
          background: #33aa44;
        }
      `,
    });

    const badgeCell = result.frames[0]!.get(1, 0);
    expect(badgeCell.fg).toBe('#001122');
    expect(badgeCell.bg).toBe('#33aa44');
  });
});
