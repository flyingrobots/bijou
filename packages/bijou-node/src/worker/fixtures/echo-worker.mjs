import { isMainThread, parentPort } from 'node:worker_threads';

if (!isMainThread && parentPort) {
  parentPort.postMessage({ type: 'render:frame', output: 'worker:booting' });

  parentPort.on('message', (msg) => {
    if (msg?.type === 'data') {
      const text = msg.payload?.text ?? 'unknown';
      parentPort.postMessage({ type: 'data', payload: { type: 'ack', text } });
      parentPort.postMessage({ type: 'render:frame', output: `worker:${text}` });
      parentPort.postMessage({ type: 'quit' });
    }
  });
}
