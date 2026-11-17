import { describe, expect, it } from 'vitest';
import { windowsCommand, windowsStage } from './windows-stage.mjs';

describe('Windows bootstrap failure attribution', () => {
  it('preserves successful subprocess output', async () => {
    const result = await windowsCommand('extract-node', [process.execPath, '-e', 'process.stdout.write("extracted")']);
    expect(result.output.toString()).toBe('extracted');
    expect(result.code).toBe(0);
  });

  it('retains the exact operation failure as the cause', async () => {
    const original = new Error('Checksum mismatch');
    const failure: unknown = await windowsStage('download-git', () => Promise.reject(original)).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(Error);
    if (!(failure instanceof Error)) throw new Error('Expected attributed failure');
    expect(failure.message).toContain('download-git');
    expect(failure.cause).toBe(original);
  });

  it('identifies a timed-out real subprocess and retains a bounded output tail', async () => {
    const script = 'process.stdout.write("discarded-prefix" + "x".repeat(8192) + "last-extraction-entry"); setInterval(() => {}, 1000)';
    const failure: unknown = await windowsCommand('extract-git', [process.execPath, '-e', script], {
      timeout: 750,
    }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(Error);
    if (!(failure instanceof Error)) throw new Error('Expected attributed timeout');
    expect(failure.message).toContain('extract-git');
    expect(failure.message).toContain('Operation deadline exceeded');
    expect(failure.message).toContain('last-extraction-entry');
    expect(failure.message).not.toContain('discarded-prefix');
    expect(failure.message.length).toBeLessThan(2300);
    expect(failure.cause).toBeInstanceOf(Error);
  });
});
