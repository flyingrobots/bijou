import { describe, it, expect } from 'vitest';
import { mousePress, runScript } from './driver.js';
import type { App, MouseMsg } from './types.js';
import { isResizeMsg } from './types.js';
import { stringToSurface, surfaceToString } from '@flyingrobots/bijou';
import { must, plainStyle } from '@flyingrobots/bijou/adapters/test';

const style = plainStyle();

function textView(text: string) {
  const lines = text.split('\n');
  const width = Math.max(1, ...lines.map((line) => line.length));
  return stringToSurface(text, width, Math.max(1, lines.length));
}

describe('runScript', () => {
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
          return textView(`${String(model.cols)}x${String(model.rows)}`);
        },
      };

      const result = await runScript(app, [{ resize: { columns: 120, rows: 40 } }]);
      expect(result.model.cols).toBe(120);
      expect(result.model.rows).toBe(40);
      expect(surfaceToString(must(result.frames[result.frames.length - 1]), style)).toContain('120x40');
    });

  it('uses the latest scripted dimensions when normalizing layout views', async () => {
      interface Model { cols: number; rows: number }
      const app: App<Model> = {
        init: () => [{ cols: 8, rows: 1 }, []],
        update(msg, model) {
          if (isResizeMsg(msg)) {
            return [{ cols: msg.columns, rows: msg.rows }, []];
          }
          return [model, []];
        },
        view(model) {
          return {
            type: 'TestLayoutNode',
            rect: { x: 0, y: 0, width: 8, height: 1 },
            children: [],
            surface: stringToSurface(`${String(model.cols)}x${String(model.rows)}`, 8, 1),
          };
        },
      };

      const result = await runScript(app, [
        { resize: { columns: 18, rows: 3 } },
      ]);

      const lastFrame = must(result.frames[result.frames.length - 1]);
      expect(lastFrame.width).toBe(18);
      expect(lastFrame.height).toBe(3);
      expect(surfaceToString(lastFrame, style)).toContain('18x3');
    });

  it('emits custom msg steps', async () => {
      interface Msg { type: 'inc' }
      interface Model { count: number }
      const app: App<Model, Msg> = {
        init: () => [{ count: 0 }, []],
        update(_msg, model) {
          return [{ count: model.count + 1 }, []];
        },
        view(model) {
          return textView(`Count: ${String(model.count)}`);
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
          return textView(`Clicked: ${String(model.clicked)}`);
        },
      };

      const result = await runScript(app, [mousePress('left', 4, 2)]);

      expect(result.model.clicked).toBe(1);
    });
});
