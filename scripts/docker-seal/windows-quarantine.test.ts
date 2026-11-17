import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { requireWindowsBootstrapClear, windowsBootstrapQuarantined, withWindowsDaemonCustody } from './windows-quarantine.mjs';

async function withTemporaryCustody(operation: (root: string) => Promise<void>): Promise<void> {
  const root = mkdtempSync(join(tmpdir(), 'bootstrap-custody-'));
  const previous = process.env['RUNNER_TEMP'];
  process.env['RUNNER_TEMP'] = root;
  try { await operation(root); }
  finally {
    if (previous === undefined) delete process.env['RUNNER_TEMP'];
    else process.env['RUNNER_TEMP'] = previous;
    rmSync(root, { recursive: true, force: true });
  }
}

describe('Windows bootstrap custody', () => {
  it('holds quarantine throughout an operation and clears it only after success', async () => {
    await withTemporaryCustody(async () => {
      requireWindowsBootstrapClear();
      const result = await withWindowsDaemonCustody({ operation: 'fixture' }, async () => {
        expect(windowsBootstrapQuarantined()).toBe(true);
        return Promise.resolve('finished');
      });
      expect(result).toBe('finished');
      expect(windowsBootstrapQuarantined()).toBe(false);
      requireWindowsBootstrapClear();
    });
  });

  it('retains failed-operation custody and prevents a second operation from starting', async () => {
    await withTemporaryCustody(async (root) => {
      await expect(withWindowsDaemonCustody({ operation: 'fixture failure' }, () =>
        Promise.reject(new Error('fixture daemon failure')))).rejects.toThrow('fixture daemon failure');
      expect(windowsBootstrapQuarantined()).toBe(true);
      expect(() => { requireWindowsBootstrapClear(); }).toThrow('custody is uncertain');
      const second = join(root, 'second-operation');
      await expect(withWindowsDaemonCustody({ operation: 'forbidden retry' }, () => {
        writeFileSync(second, 'started');
        return Promise.resolve();
      })).rejects.toThrow('custody is uncertain');
      expect(existsSync(second)).toBe(false);
    });
  });
});
