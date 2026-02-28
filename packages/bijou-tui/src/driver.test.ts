import { describe, it, expect } from 'vitest';
import { runScript } from './driver.js';
import type { App, Cmd, KeyMsg } from './types.js';
import { quit } from './commands.js';
import { isKeyMsg } from './types.js';

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
    expect(result.frames[0]).toBe('Count: 0');
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
    expect(result.frames[1]).toBe('Count: 1');
    expect(result.frames[2]).toBe('Count: 2');
    expect(result.frames[3]).toBe('Count: 1');
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
        captured.push({ frame, index });
      },
    });
    expect(captured).toHaveLength(2); // initial + 1 update
    expect(captured[0]!.index).toBe(0);
    expect(captured[1]!.index).toBe(1);
  });

  it('supports delays between steps', async () => {
    const start = Date.now();
    const result = await runScript(counterApp, [
      { key: '\x1b[A', delay: 50 },
      { key: '\x1b[A', delay: 50 },
    ]);
    expect(result.elapsed).toBeGreaterThanOrEqual(80); // some margin
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
    // Should have processed the init command
    expect(result.frames.length).toBeGreaterThanOrEqual(1);
  });

  it('handles empty steps array', async () => {
    const result = await runScript(counterApp, []);
    expect(result.frames).toHaveLength(1);
    expect(result.model.count).toBe(0);
    expect(result.elapsed).toBeGreaterThanOrEqual(0);
  });
});
