import { describe, it, expect } from 'vitest';
import { testRuntime } from './driver.js';
import type { App } from './types.js';
import { stringToSurface, surfaceToString } from '@flyingrobots/bijou';
import { plainStyle } from '@flyingrobots/bijou/adapters/test';

const style = plainStyle();

function textView(text: string) {
  const lines = text.split('\n');
  const width = Math.max(1, ...lines.map((line) => line.length));
  return stringToSurface(text, width, Math.max(1, lines.length));
}

describe('runScript', () => {
  it('records snapshots, handled messages, and emitted command messages', async () => {
      type Msg = { type: 'load' } | { type: 'loaded'; value: string };
      interface Model { value: string; loaded: boolean }
      const app: App<Model, Msg> = {
        init: () => [{
          value: '',
          loaded: false,
        }, [() => ({ type: 'loaded', value: 'hello' })]],
        update(msg, model) {
          if ('type' in msg && msg.type === 'loaded') {
            return [{ value: msg.value, loaded: true }, []];
          }
          return [model, []];
        },
        view(model) {
          return textView(model.loaded ? `Loaded: ${model.value}` : 'Loading...');
        },
      };
      const harness = await testRuntime(app);
      expect(harness.snapshots).toHaveLength(2);
      expect(harness.snapshots[0]?.cause).toBe('init');
      expect(harness.snapshots[1]?.cause).toBe('update');
      expect(harness.messages).toEqual([{ type: 'loaded', value: 'hello' }]);
      expect(harness.emittedMessages).toEqual([{ type: 'loaded', value: 'hello' }]);
      expect(harness.commands).toHaveLength(1);
      expect(harness.commands[0]?.source).toBe('init');
      expect(harness.commands[0]?.resolution).toBe('message');
      expect(harness.commands[0]?.settled).toBe(true);
      expect(surfaceToString(harness.frame, style)).toContain('Loaded: hello');
    });

  it('disposes cleanup-producing commands during harness teardown', async () => {
      let disposeCalls = 0;
      const cleanup = () => {
        disposeCalls += 1;
      };
      const app: App<string> = {
        init: () => ['cleanup', [() => cleanup]],
        update: (_msg, model) => [model, []],
        view: (model) => textView(model),
      };
      const harness = await testRuntime(app);
      expect(harness.commands).toHaveLength(1);
      expect(harness.commands[0]?.resolution).toBe('cleanup');
      expect(harness.commands[0]?.cleanedUp).toBe(false);
      await harness.teardown();
      expect(disposeCalls).toBe(1);
      expect(harness.commands[0]?.cleanedUp).toBe(true);
      expect(harness.running).toBe(false);
    });
});
