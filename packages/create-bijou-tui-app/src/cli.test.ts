import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { runCli } from './cli.js';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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
    .mockImplementation((chunk: string | Uint8Array) => {
      stdout += chunkToString(chunk);
      return true;
    });
  const stderrSpy = vi.spyOn(process.stderr, 'write')
    .mockImplementation((chunk: string | Uint8Array) => {
      stderr += chunkToString(chunk);
      return true;
    });

  try {
    return { code: runCli(argv), stdout, stderr };
  } finally {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  }
}

function withPlatform<T>(platform: NodeJS.Platform, run: () => T): T {
  const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue(platform);
  try {
    return run();
  } finally {
    platformSpy.mockRestore();
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
      const cdLine = result.stdout.split('\n').find((line) => line.trimStart().startsWith('cd '));
      expect(cdLine).toBeDefined();
      expect(cdLine).toContain(targetDir);
      expect(cdLine).toMatch(/^\s*cd\s+(['"]).*\1$/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('escapes single quotes in cd instruction paths', () => {
    const root = mkdtempSync(join(tmpdir(), 'create-bijou-test-'));
    try {
      const targetDir = join(root, "my app's workspace");
      const result = withPlatform('darwin', () => runCliCaptured([targetDir, '--no-install']));
      expect(result.code).toBe(0);
      const cdLine = result.stdout.split('\n').find((line) => line.trimStart().startsWith('cd '));
      expect(cdLine).toContain("'\"'\"'");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('uses Windows-safe cd quoting when process platform is win32', () => {
    const root = mkdtempSync(join(tmpdir(), 'create-bijou-test-'));
    try {
      const targetDir = join(root, 'my app');
      const result = withPlatform('win32', () => runCliCaptured([targetDir, '--no-install']));
      expect(result.code).toBe(0);
      const cdLine = result.stdout.split('\n').find((line) => line.trimStart().startsWith('cd '));
      expect(cdLine).toBeDefined();
      expect(cdLine).toContain(`cd "${targetDir}"`);
      expect(cdLine).not.toContain(`cd '${targetDir}'`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('escapes cmd.exe metacharacters in Windows cd instructions', () => {
    const root = mkdtempSync(join(tmpdir(), 'create-bijou-test-'));
    try {
      const targetDir = join(root, 'my %APPDATA%^ app');
      const result = withPlatform('win32', () => runCliCaptured([targetDir, '--no-install']));
      expect(result.code).toBe(0);
      const cdLine = result.stdout.split('\n').find((line) => line.trimStart().startsWith('cd '));
      expect(cdLine).toBeDefined();
      expect(cdLine).toContain('%%APPDATA%%^^');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('runs correctly through the packed npm bin shim', () => {
    const root = mkdtempSync(join(tmpdir(), 'create-bijou-pack-cli-'));
    const packDir = join(root, 'pack');
    const runnerDir = join(root, 'runner');
    const targetDir = join(root, 'generated-app');
    mkdirSync(packDir, { recursive: true });
    mkdirSync(runnerDir, { recursive: true });

    try {
      const packed = spawnSync('npm', ['pack', '--json', '--pack-destination', packDir], {
        cwd: PACKAGE_ROOT,
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
        timeout: 90_000,
      });
      expect(packed.error).toBeUndefined();
      expect(packed.status).toBe(0);
      const arrayStart = packed.stdout.indexOf('[');
      const arrayEnd = packed.stdout.lastIndexOf(']');
      expect(arrayStart).toBeGreaterThanOrEqual(0);
      expect(arrayEnd).toBeGreaterThan(arrayStart);
      const packOutput = JSON.parse(packed.stdout.slice(arrayStart, arrayEnd + 1)) as Array<{ filename?: string }>;
      const tarball = resolve(packDir, packOutput[0]!.filename!);

      const installed = spawnSync(
        'npm',
        [
          'install',
          '--prefix', runnerDir,
          '--no-package-lock',
          '--no-save',
          '--no-audit',
          '--fund=false',
          '--ignore-scripts',
          `file:${tarball}`,
        ],
        {
          cwd: PACKAGE_ROOT,
          encoding: 'utf8',
          maxBuffer: 8 * 1024 * 1024,
          timeout: 90_000,
        },
      );
      expect(installed.error).toBeUndefined();
      expect(installed.status).toBe(0);

      const binPath = join(runnerDir, 'node_modules', '.bin', 'create-bijou-tui-app');
      expect(existsSync(binPath)).toBe(true);

      const result = spawnSync(binPath, [targetDir, '--no-install'], {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
        timeout: 30_000,
      });
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Created project in');
      expect(existsSync(join(targetDir, 'package.json'))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 180000);
});
