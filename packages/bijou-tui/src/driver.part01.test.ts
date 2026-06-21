import { describe, it, expect } from 'vitest';
import { runScript } from './driver.js';
import type { App, Cmd } from './types.js';
import { quit } from './commands.js';
import { isKeyMsg } from './types.js';
import { stringToSurface, surfaceToString } from '@flyingrobots/bijou';
import { must, createTestContext, mockClock, plainStyle } from '@flyingrobots/bijou/adapters/test';

const style = plainStyle();

function textView(text: string) {
  const lines = text.split('\n');
  const width = Math.max(1, ...lines.map((line) => line.length));
  return stringToSurface(text, width, Math.max(1, lines.length));
}

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
    return textView(`Count: ${String(model.count)}`);
  },
};

describe('runScript', () => {
  it('captures initial frame', async () => {
      const result = await runScript(counterApp, []);
      expect(result.frames).toHaveLength(1);
      expect(surfaceToString(must(result.frames[0]), style)).toContain('Count: 0');
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
      expect(surfaceToString(must(result.frames[1]), style)).toContain('Count: 1');
      expect(surfaceToString(must(result.frames[2]), style)).toContain('Count: 2');
      expect(surfaceToString(must(result.frames[3]), style)).toContain('Count: 1');
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
      const captured: { frame: string; index: number }[] = [];
      await runScript(counterApp, [{ key: '\x1b[A' }], {
        onFrame(frame, index) {
          captured.push({ frame: surfaceToString(frame, style), index });
        },
      });
      expect(captured).toHaveLength(2); // initial + 1 update
      expect(captured[0]?.index).toBe(0);
      expect(captured[1]?.index).toBe(1);
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
      interface Msg { type: 'loaded'; data: string }
      interface Model { data: string; loaded: boolean }

      const app: App<Model, Msg> = {
        init(): [Model, Cmd<Msg>[]] {
          const cmd: Cmd<Msg> = () => ({ type: 'loaded', data: 'hello' });
          return [{ data: '', loaded: false }, [cmd]];
        },
        update(msg, model) {
          if (!('data' in msg)) return [model, []];
          return [{ data: msg.data, loaded: true }, []];
        },
        view(model) {
          return textView(model.loaded ? `Data: ${model.data}` : 'Loading...');
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
});
