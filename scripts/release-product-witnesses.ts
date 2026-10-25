#!/usr/bin/env tsx
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  verifyReleaseWitnessFiles, witnessFileHash, type ReleaseProductWitnessReceipt,
} from './release-product-witness-files.js';

const STEPS: readonly { readonly label: string; readonly args: readonly string[] }[] = [
  { label: 'fresh-build', args: ['node_modules/typescript/bin/tsc', '-b', '--force'] },
  {
    label: 'DX-050-generated-artifacts',
    args: ['--import', 'tsx', 'scripts/generate-profunctor-page-target.ts', '--check'],
  },
  ...['DX-050', 'DX-049', 'RE-036'].map((family) => ({
    label: `${family}-product-contract-tests`,
    args: ['node_modules/vitest/vitest.mjs', 'run', `tests/cycles/${family}`, '--maxWorkers', '2'],
  })),
];

export function replayReleaseProductWitnesses(root: string): ReleaseProductWitnessReceipt {
  // Git owns worktree-root identity; host path spellings can differ on Windows.
  if (git(root, ['rev-parse', '--show-prefix']) !== '') {
    throw new Error('Run the witness replay from the repository root.');
  }
  assertClean(root);
  const sourceCommit = git(root, ['rev-parse', '--verify', 'HEAD']);
  const files = verifyReleaseWitnessFiles(root);
  const lockSha256 = witnessFileHash(root, 'package-lock.json');
  for (const step of STEPS) {
    process.stderr.write(`Witness replay: ${step.label}\n`);
    const result = spawnSync(process.execPath, step.args, {
      cwd: root, encoding: 'utf8', timeout: 180_000, maxBuffer: 2 * 1024 * 1024,
    });
    if (result.error != null) throw result.error;
    process.stderr.write(result.stdout);
    process.stderr.write(result.stderr);
    if (result.status !== 0) throw new Error(`Witness failed: ${step.label}`);
  }
  verifyReleaseWitnessFiles(root);
  assertClean(root);
  if (git(root, ['rev-parse', '--verify', 'HEAD']) !== sourceCommit ||
    witnessFileHash(root, 'package-lock.json') !== lockSha256) {
    throw new Error('Checkout identity changed during witness replay.');
  }
  return {
    schema: 'bijou-product-witness-replay/1',
    scope: 'product-witnesses-only',
    sourceCommit, packageVersion: packageVersion(root), nodeVersion: process.version,
    lockSha256, files,
    checks: STEPS.map((step): ReleaseProductWitnessReceipt['checks'][number] => ({
      label: step.label, command: ['node', ...step.args], status: 'pass',
    })),
  };
}

function git(root: string, args: readonly string[]): string {
  return execFileSync('git', [...args], {
    cwd: root, encoding: 'utf8', timeout: 10_000, maxBuffer: 128 * 1024,
  }).trim();
}

function assertClean(root: string): void {
  if (git(root, ['status', '--porcelain=v1', '--untracked-files=normal']) !== '') {
    throw new Error('Witness replay requires a clean checkout, including untracked files.');
  }
}

function packageVersion(root: string): string {
  const value: unknown = JSON.parse(readFileSync(resolve(root, 'packages/bijou/package.json'), 'utf8'));
  if (value == null || typeof value !== 'object' || !('version' in value) ||
    typeof value.version !== 'string') throw new Error('Missing Bijou package version.');
  return value.version;
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    if (process.argv.length !== 2) throw new Error('Usage: release-product-witnesses.ts');
    process.stdout.write(`${JSON.stringify(replayReleaseProductWitnesses(process.cwd()), null, 2)}\n`);
  } catch (error: unknown) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
