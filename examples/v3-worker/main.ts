import { isBijouWorker, runInWorker, startWorkerApp } from '../../packages/bijou-node/src/worker/worker.js';
import { run, quit, isKeyMsg, type App } from '@flyingrobots/bijou-tui';
import { badge, createSurface, stringToSurface } from '@flyingrobots/bijou';

interface Model {
  count: number;
}

const app: App<Model, any> = {
  init: () => [{ count: 0 }, []],
  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) return [model, [quit()]];
      if (msg.key === ' ') {
        // Simulating a heavy synchronous task in the worker
        // If this was running in the main thread, the TTY would freeze!
        let x = 0;
        for (let i = 0; i < 500_000_000; i++) x += i;
        
        return [{ count: model.count + 1 }, []];
      }
    }
    return [model, []];
  },
  view: (model) => {
    const header = badge('BACKGROUND WORKER RUNTIME', { variant: 'primary' });
    const counter = badge(`Count: ${model.count}`, { variant: 'accent' });
    const text = stringToSurface('Press SPACE to trigger a heavy task. Press Q to quit.', 60, 1);
    const text2 = stringToSurface('The main thread stays perfectly responsive!', 60, 1);
    
    const full = createSurface(80, 24);
    full.blit(header, 5, 2);
    full.blit(counter, 5, 4);
    full.blit(text, 5, 6);
    full.blit(text2, 5, 7);

    return full;
  }
};

// Entry Point Logic
// Because we use the same file for both main and worker threads in this demo,
// we branch based on the environment flag.

if (isBijouWorker()) {
  // We are in the background thread. Start the app!
  startWorkerApp(app);
} else {
  // We are in the main thread. Spawn the worker!
  const entryPath = new URL(import.meta.url).pathname;
  
  runInWorker({
    entry: entryPath,
  }).then(() => {
    console.log('Worker finished cleanly.');
  }).catch(err => {
    console.error('Worker failed:', err);
  });
}
