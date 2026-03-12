import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runInWorker } from './worker.js';

describe('worker runtime', () => {
  it('forwards custom data messages between the main thread and worker app', async () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const received: unknown[] = [];
    const here = dirname(fileURLToPath(import.meta.url));
    const entry = resolve(here, 'fixtures/echo-worker.mjs');

    const handle = runInWorker({
      ctx,
      entry,
      onMessage(payload) {
        received.push(payload);
      },
    });

    handle.send({ type: 'host-note', text: 'from-main' });
    await handle.onExit;

    expect(received).toEqual([{ type: 'ack', text: 'from-main' }]);
    expect(ctx.io.written.some((chunk) => chunk.includes('worker:from-main'))).toBe(true);
  });

  it('disables only the mouse modes it enables', async () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const here = dirname(fileURLToPath(import.meta.url));
    const entry = resolve(here, 'fixtures/echo-worker.mjs');

    const handle = runInWorker({
      ctx,
      entry,
      mouse: true,
      onMessage() {},
    });

    handle.send({ type: 'host-note', text: 'from-main' });
    await handle.onExit;

    const output = ctx.io.written.join('');
    expect(output).toContain('\x1b[?1000h\x1b[?1002h\x1b[?1006h');
    expect(output).toContain('\x1b[?1000l\x1b[?1002l\x1b[?1006l');
    expect(output).not.toContain('\x1b[?1003l');
  });
});
