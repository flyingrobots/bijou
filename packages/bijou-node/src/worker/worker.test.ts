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
    const entry = resolve(here, 'fixtures/echo-worker.ts');

    const handle = runInWorker({
      ctx,
      entry,
      execArgv: ['--import', 'tsx'],
      onMessage(payload) {
        received.push(payload);
      },
    });

    handle.send({ type: 'host-note', text: 'from-main' });
    await handle.onExit;

    expect(received).toEqual([{ type: 'ack', text: 'from-main' }]);
    expect(ctx.io.written.some((chunk) => chunk.includes('worker:from-main'))).toBe(true);
  });
});
