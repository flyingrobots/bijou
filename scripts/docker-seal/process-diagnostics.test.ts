import { describe, expect, it } from 'vitest';
import { execute } from './process.mjs';

const failing = 'process.stdout.write(Buffer.from([0, 1, 2])); process.stderr.write("discarded-prefix" + "x".repeat(4096) + "fatal: detected the cause"); process.exit(128)';

describe('sealed subprocess failure diagnostics', () => {
  it('reports the end of stderr when a binary subprocess fails', async () => {
    const failure: unknown = await execute([process.execPath, '-e', failing], { binary: true }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(Error);
    if (!(failure instanceof Error)) throw new Error('Expected a subprocess failure');
    expect(failure.message).toContain('exited 128');
    expect(failure.message).toContain('fatal: detected the cause');
  });

  it('bounds the reported stderr of a binary subprocess', async () => {
    const failure: unknown = await execute([process.execPath, '-e', failing], { binary: true }).catch((error: unknown) => error);
    if (!(failure instanceof Error)) throw new Error('Expected a subprocess failure');
    expect(failure.message).not.toContain('discarded-prefix');
    expect(failure.message.length).toBeLessThan(2300);
  });

  it('keeps stderr out of the binary output of a successful subprocess', async () => {
    const script = 'process.stdout.write(Buffer.from([0, 1, 2])); process.stderr.write("progress")';
    const result = await execute([process.execPath, '-e', script], { binary: true });
    expect([...result.output]).toEqual([0, 1, 2]);
  });
});
