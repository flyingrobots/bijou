import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { runCli } from './cli.js';

function chunkToString(chunk: unknown): string {
  if (typeof chunk === 'string') return chunk;
  if (chunk instanceof Uint8Array) return Buffer.from(chunk).toString('utf8');
  return String(chunk);
}

function runCliCaptured(argv: readonly string[]): {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
} {
  let stdout = '';
  let stderr = '';
  const stdoutSpy = vi.spyOn(process.stdout, 'write')
    .mockImplementation(((chunk: unknown) => {
      stdout += chunkToString(chunk);
      return true;
    }) as never);
  const stderrSpy = vi.spyOn(process.stderr, 'write')
    .mockImplementation(((chunk: unknown) => {
      stderr += chunkToString(chunk);
      return true;
    }) as never);

  try {
    return { code: runCli(argv), stdout, stderr };
  } finally {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  }
}

describe('create-bijou-tui-app cli', () => {
  it('prints usage for argument parsing errors', () => {
    const result = runCliCaptured(['--definitely-not-a-real-flag']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Unknown option');
    expect(result.stderr).toContain('Usage: npm create bijou-tui-app@latest');
  });

  it('does not print usage for non-argument runtime failures', () => {
    const root = mkdtempSync(join(tmpdir(), 'create-bijou-test-'));
    try {
      const targetFile = join(root, 'not-a-dir');
      writeFileSync(targetFile, 'occupied', 'utf8');

      const result = runCliCaptured([targetFile, '--no-install']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Target path is not a directory');
      expect(result.stderr).toContain('Tip: run with --help to see CLI options.');
      expect(result.stderr).not.toContain('Usage: npm create bijou-tui-app@latest');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('quotes target paths in next-step cd instructions', () => {
    const root = mkdtempSync(join(tmpdir(), 'create-bijou-test-'));
    try {
      const targetDir = join(root, 'my app');
      const result = runCliCaptured([targetDir, '--no-install']);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain(`cd "${targetDir}"`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
