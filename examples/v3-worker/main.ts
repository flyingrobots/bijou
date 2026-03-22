import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  isBijouWorker,
  runInWorker,
  sendToMain,
  startWorkerApp,
} from '@flyingrobots/bijou-node';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { badge, boxSurface, getDefaultContext, setDefaultContext } from '@flyingrobots/bijou';
import { isKeyMsg, quit, type App, vstackSurface } from '@flyingrobots/bijou-tui';
import { centerSurface, line, spacer } from '../_shared/example-surfaces.ts';

interface Model {
  completedJobs: number;
  status: string;
  lastHostNote: string;
}

type WorkerMsg =
  | { type: 'host-note'; text: string };

export const app: App<Model, WorkerMsg> = {
  init: () => [{
    completedJobs: 0,
    status: 'Idle',
    lastHostNote: 'Waiting for host message',
  }, []],

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) return [model, [quit()]];

      if (msg.key === ' ') {
        const startedAt = Date.now();
        let total = 0;
        for (let i = 0; i < 75_000_000; i++) total += i;
        const durationMs = Date.now() - startedAt;
        sendToMain({ type: 'job-finished', durationMs, total });

        return [{
          ...model,
          completedJobs: model.completedJobs + 1,
          status: `Completed heavy task in ${durationMs}ms`,
        }, []];
      }
    }

    if ('type' in msg && msg.type === 'host-note') {
      return [{ ...model, lastHostNote: msg.text }, []];
    }

    return [model, []];
  },

  view: (model) => {
    const card = boxSurface(
      vstackSurface(
        badge('Worker Runtime', { variant: 'primary' }),
        spacer(1, 1),
        badge(`Jobs ${model.completedJobs}`, { variant: 'accent' }),
        spacer(1, 1),
        line('Press SPACE to run a synchronous CPU-heavy task in the worker thread.'),
        line('Press Q to quit.'),
        spacer(1, 1),
        line(`Status: ${model.status}`),
        line(`Host note: ${model.lastHostNote}`),
      ),
      { title: 'Background Thread', padding: { top: 1, bottom: 1, left: 2, right: 2 } },
    );

    return centerSurface(getDefaultContext(), card);
  },
};

if (process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (isBijouWorker()) {
    await startWorkerApp(app);
  } else {
    const useMockContext = process.env['CI'] === '1'
      || process.stdin.isTTY !== true
      || typeof process.stdin.setRawMode !== 'function';
    const ctx = useMockContext
      ? createTestContext({
          mode: 'interactive',
          runtime: { columns: 88, rows: 18 },
          io: { keys: ['q'] },
        })
      : undefined;

    if (ctx) {
      setDefaultContext(ctx);
    }

    const handle = runInWorker({
      ctx,
      altScreen: !useMockContext,
      hideCursor: !useMockContext,
      entry: fileURLToPath(import.meta.url),
      execArgv: ['--import', 'tsx'],
      onMessage(payload) {
        if (typeof payload === 'object' && payload !== null && 'type' in payload && payload.type === 'job-finished') {
          process.stderr.write(`[worker] heavy task finished in ${payload.durationMs}ms\n`);
        }
      },
    });

    if (useMockContext) {
      handle.send({ type: 'host-note', text: 'Main thread says hello via the data channel.' });
    } else {
      setTimeout(() => {
        handle.send({ type: 'host-note', text: 'Main thread says hello via the data channel.' });
      }, 800);
    }

    await handle.onExit;
  }
}
