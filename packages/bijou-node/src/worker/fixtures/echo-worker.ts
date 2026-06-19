import { isMainThread, parentPort } from 'node:worker_threads';

const port = parentPort;

if (!isMainThread && port) {
  port.postMessage({ type: 'render:frame', output: 'worker:booting' });

  port.on('message', (msg: { type: string; payload?: { text?: string } }) => {
    if (msg.type === 'data') {
      const text = msg.payload?.text ?? 'unknown';
      port.postMessage({ type: 'data', payload: { type: 'ack', text } });
      port.postMessage({ type: 'render:frame', output: `worker:${text}` });
      port.postMessage({ type: 'quit' });
    }
  });
}
