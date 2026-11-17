import { spawn } from 'node:child_process';
import { statfsSync } from 'node:fs';
import { LIMITS, cleanEnvironment } from './constants.mjs';
const sessionDeadline = Date.now() + LIMITS.deadline;
export function freeBytes(path) {
  const stat = statfsSync(path, { bigint: true });
  return Number(stat.bavail * stat.bsize);
}
export function requireFree(path) {
  const bytes = freeBytes(path);
  if (bytes < LIMITS.free) throw new Error(`Host free-space floor reached: ${bytes}`);
  return bytes;
}
/** Bound every orchestration subprocess; callers additionally stop its container. */
export function execute(argv, options = {}) {
  if (options.signal?.aborted) return Promise.reject(new Error('Operation aborted'));
  if (!options.cleanup && Date.now() >= sessionDeadline) return Promise.reject(new Error('Session deadline exceeded'));
  return new Promise((resolve, reject) => {
    const child = spawn(argv[0], argv.slice(1), {
      cwd: options.cwd, env: options.env ?? cleanEnvironment(),
      stdio: ['pipe', 'pipe', 'pipe'], detached: process.platform !== 'win32',
    });
    const chunks = []; let bytes = 0; let diagnosticBytes = 0; let failure; let settled = false;
    const stop = (error) => {
      if (settled) return;
      failure ??= error;
      try {
        if (process.platform === 'win32') child.kill('SIGKILL');
        else process.kill(-child.pid, 'SIGKILL');
      } catch { /* Already reaped. */ }
    };
    const aborted = () => stop(new Error('Operation aborted'));
    options.signal?.addEventListener('abort', aborted, { once: true });
    const capture = (chunk) => {
      bytes += chunk.length;
      if (bytes > (options.maxBytes ?? LIMITS.log)) return stop(new Error('Output budget exceeded'));
      chunks.push(chunk);
      options.onData?.(chunk);
    };
    child.stdout.on('data', capture);
    child.stderr.on('data', options.binary ? (chunk) => {
      diagnosticBytes += chunk.length;
      if (diagnosticBytes > LIMITS.log) return stop(new Error('Diagnostic output budget exceeded'));
      if (chunk.length) options.onDiagnostic?.(chunk.toString());
    } : capture);
    child.on('error', (error) => { failure = error; });
    const timer = setTimeout(() => stop(new Error('Operation deadline exceeded')),
      Math.min(options.timeout ?? LIMITS.deadline, options.cleanup ? 15_000 : sessionDeadline - Date.now()));
    let checking = false;
    const monitor = setInterval(() => {
      try { requireFree(options.hostPath ?? process.cwd()); }
      catch (error) { stop(error); }
      if (options.monitor && !checking) {
        checking = true;
        Promise.resolve().then(options.monitor).catch(stop).finally(() => { checking = false; });
      }
    }, 1000);
    child.on('close', (code) => {
      settled = true;
      clearTimeout(timer); clearInterval(monitor);
      options.signal?.removeEventListener('abort', aborted);
      const output = Buffer.concat(chunks);
      if (failure) reject(failure);
      else if (code !== 0 && !options.allowFailure) reject(new Error(`${argv[0]} exited ${code}: ${output.toString().slice(-2000)}`));
      else resolve({ code: code ?? 1, output });
    });
    child.stdin.on('error', (error) => { if (error.code !== 'EPIPE') stop(error); });
    child.stdin.end(options.input);
  });
}
export async function readInput() {
  if (process.stdin.isTTY) return Buffer.alloc(0);
  const timer = setTimeout(() => process.stdin.destroy(new Error('Hook stdin did not close within 30 seconds')), 30_000);
  try { return await collectInput(process.stdin); }
  finally { clearTimeout(timer); }
}
export async function collectInput(stream) {
  const chunks = []; let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > LIMITS.stdin) throw new Error('Hook stdin exceeds 1 MiB');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
