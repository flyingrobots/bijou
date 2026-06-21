import { existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
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
  const code = runCli(argv, {
    stdout: { write: (chunk: string): true => { stdout += chunkToString(chunk); return true; } },
    stderr: { write: (chunk: string): true => { stderr += chunkToString(chunk); return true; } },
  });
  return { code, stdout, stderr };
}
function runCliCapturedForPlatform(platform: NodeJS.Platform, argv: readonly string[]): {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
} {
  let stdout = '';
  let stderr = '';
  const code = runCli(argv, {
    platform,
    stdout: { write: (chunk: string): true => { stdout += chunkToString(chunk); return true; } },
    stderr: { write: (chunk: string): true => { stderr += chunkToString(chunk); return true; } },
  });
  return { code, stdout, stderr };
}
function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${label} is not an object`);
  return value;
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function resolveInstalledCliCommand(runnerDir: string): string {
  const binDir = join(runnerDir, 'node_modules', '.bin');
  return process.platform === 'win32'
    ? join(binDir, 'create-bijou-tui-app.cmd')
    : join(binDir, 'create-bijou-tui-app');
}
function resolveInstalledCliEntrypoint(runnerDir: string): string {
  const packageDir = join(runnerDir, 'node_modules', 'create-bijou-tui-app');
  const packageJson = requireRecord(JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8')), 'package.json');
  const bin = packageJson['bin'];
  const binRelative = typeof bin === 'string' ? bin : requireRecord(bin, 'package.json bin')['create-bijou-tui-app'];
  if (typeof binRelative !== 'string' || binRelative.length === 0) {
    throw new Error('Installed package lacks create-bijou-tui-app bin.');
  }
  return join(packageDir, binRelative);
}
export {
  chunkToString,
  describe,
  dirname,
  existsSync,
  expect,
  fileURLToPath,
  isRecord,
  it,
  join,
  mkdirSync,
  mkdtempSync,
  PACKAGE_ROOT,
  readFileSync,
  realpathSync,
  requireRecord,
  resolve,
  resolveInstalledCliCommand,
  resolveInstalledCliEntrypoint,
  rmSync,
  runCli,
  runCliCaptured,
  runCliCapturedForPlatform,
  spawnSync,
  tmpdir,
  writeFileSync,
};
