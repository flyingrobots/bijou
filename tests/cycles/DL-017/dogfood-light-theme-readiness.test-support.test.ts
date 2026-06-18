import { describe, expect, it } from 'vitest';
import { createSurface } from '@flyingrobots/bijou';
import type { App, Cmd } from '../../../packages/bijou-tui/src/types.js';
import { runKeysDeterministically } from './dogfood-light-theme-readiness.test-support.js';

interface TestMsg {
  readonly type: 'emitted-from-cleanup';
}

interface TestModel {
  readonly seen: readonly string[];
}

describe('runKeysDeterministically', () => {
  it('dispatches messages emitted before a cleanup command settles', async () => {
    const command: Cmd<TestMsg> = (emit) => {
      emit({ type: 'emitted-from-cleanup' });
      return () => undefined;
    };
    const app: App<TestModel, TestMsg> = {
      init: () => [{ seen: [] }, [command]],
      update: (msg, model) => [{ seen: [...model.seen, msg.type] }, []],
      view: () => createSurface(1, 1),
    };

    await expect(runKeysDeterministically(app, [])).resolves.toEqual({
      seen: ['emitted-from-cleanup'],
    });
  });
});
