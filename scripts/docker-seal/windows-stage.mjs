import { execute } from './process.mjs';

/** Attribute bounded bootstrap operations without logging arguments or environment. */
export async function windowsStage(label, operation) {
  if (!/^[a-z][a-z0-9-]{0,63}$/.test(label)) throw new Error('Invalid Windows bootstrap stage');
  const started = performance.now();
  const report = (status) => process.stdout.write(`${JSON.stringify({
    bootstrap: 'windows', stage: label, status, elapsedMs: Math.round(performance.now() - started),
  })}\n`);
  report('started');
  try {
    const result = await operation();
    report('completed');
    return result;
  } catch (cause) {
    report('failed');
    const detail = cause instanceof Error ? cause.message.slice(-4096) : 'Unknown failure';
    throw new Error(`Windows bootstrap ${label} failed: ${detail}`, { cause });
  }
}

/** Retain a small diagnostic tail even when the subprocess times out. */
export function windowsCommand(label, argv, options = {}) {
  return windowsStage(label, async () => {
    let tail = Buffer.alloc(0);
    try {
      return await execute(argv, { ...options, onData: (chunk) => {
        tail = Buffer.concat([tail, chunk]).subarray(-2048);
        options.onData?.(chunk);
      } });
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message.slice(-2048) : 'Unknown failure';
      throw new Error(`${detail}; subprocess tail: ${tail.toString('utf8')}`, { cause });
    }
  });
}
