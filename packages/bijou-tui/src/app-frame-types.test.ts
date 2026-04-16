import { describe, expect, it } from 'vitest';
import {
  emitFrameAction,
  isFrameScopedMsg,
  notify,
  wrapCmdForPage,
} from './app-frame-types.js';

const TEST_CAPS = {
  onPulse: () => ({ dispose() {} }),
  sleep: async () => undefined,
  now: () => 0,
};

describe('app-frame-types', () => {
  it('passes final frame-scoped command results through page wrapping', async () => {
    const wrapped = wrapCmdForPage('home', notify<{ type: 'noop' }>({
      title: 'Saved',
      tone: 'SUCCESS',
    }));

    const result = await wrapped(() => undefined, TEST_CAPS);

    expect(isFrameScopedMsg(result)).toBe(true);
    if (!isFrameScopedMsg(result)) throw new Error('expected frame-scoped result');
    expect(result.action).toEqual({
      type: 'push-notification',
      notification: {
        title: 'Saved',
        tone: 'SUCCESS',
      },
    });
  });

  it('passes emitted frame-scoped messages through page wrapping', async () => {
    const emitted: unknown[] = [];
    const wrapped = wrapCmdForPage('home', async (emit, caps) => {
      const result = await emitFrameAction<{ type: 'noop' }>({ type: 'toggle-help' })(() => undefined, caps);
      if (result !== undefined) emit(result);
    });

    await wrapped((msg) => emitted.push(msg), TEST_CAPS);

    expect(emitted).toHaveLength(1);
    expect(isFrameScopedMsg(emitted[0])).toBe(true);
    if (!isFrameScopedMsg(emitted[0])) throw new Error('expected frame-scoped emission');
    expect(emitted[0].action).toEqual({ type: 'toggle-help' });
  });
});
