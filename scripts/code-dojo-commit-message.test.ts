import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tempDirs: string[] = [];

describe('Code Dojo commit-message hook', () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { force: true, recursive: true });
    }
  });

  it('accepts valid unscoped fix commits', () => {
    const result = runCommitMessageHook('fix: correct parser bug');

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('rejects bare fix placeholder summaries', () => {
    const result = runCommitMessageHook('fix stuff');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Garbage commit summary detected');
  });

  it('rejects Graft receipt trailers outside the repo receipt directory', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bijou-graft-receipt-'));
    tempDirs.push(dir);
    const receipt = join(dir, 'receipt.json');
    writeFileSync(receipt, '{}\n');

    const result = runCommitMessageHook([
      'fix: correct parser bug',
      '',
      'AI-Authored: true',
      'Agent: Codex',
      `Graft-Receipt: ${receipt}`,
    ].join('\n'));

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Graft receipt must be committed under .graft/receipts/');
  });

  it('rejects unstaged Graft receipt trailers', () => {
    const receipt = '.graft/receipts/commit-message-test.json';
    mkdirSync(resolve(ROOT, dirname(receipt)), { recursive: true });
    writeFileSync(resolve(ROOT, receipt), '{}\n');
    tempDirs.push(resolve(ROOT, receipt));

    const result = runCommitMessageHook([
      'fix: correct parser bug',
      '',
      'AI-Authored: true',
      'Agent: Codex',
      `Graft-Receipt: ${receipt}`,
    ].join('\n'));

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Graft receipt must be staged or already tracked');
  });
});

function runCommitMessageHook(message: string): SpawnSyncReturns<string> {
  const dir = mkdtempSync(join(tmpdir(), 'bijou-commit-message-'));
  tempDirs.push(dir);
  const file = join(dir, 'COMMIT_EDITMSG');
  writeFileSync(file, `${message}\n`);

  return spawnSync(process.execPath, [
    'scripts/code-dojo/check-commit-message.mjs',
    file,
  ], {
    cwd: ROOT,
    encoding: 'utf8',
  });
}
