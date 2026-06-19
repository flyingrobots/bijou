#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VITEST = resolve(ROOT, 'node_modules', 'vitest', 'vitest.mjs');
const CHUNK_SIZE = parsePositiveInt(process.env.BIJOU_VITEST_CHUNK_SIZE, 48);
const MAX_WORKERS = parsePositiveInt(process.env.BIJOU_VITEST_MAX_WORKERS, 2);
const BASE_ARGS = [
  'run',
  '--config',
  'vitest.config.ts',
  `--maxWorkers=${MAX_WORKERS}`,
  '--testTimeout=60000',
];

const args = process.argv.slice(2);

if (args.length > 0) {
  process.exit(runVitest([...BASE_ARGS, ...args]));
}

const files = listTestFiles();
const chunks = chunk(files, CHUNK_SIZE);

for (const [index, group] of chunks.entries()) {
  process.stdout.write(`\nvitest chunk ${index + 1}/${chunks.length} (${group.length} files)\n`);
  const status = runVitest([...BASE_ARGS, ...group]);
  if (status !== 0) process.exit(status);
}

function runVitest(vitestArgs) {
  const result = spawnSync(process.execPath, [VITEST, ...vitestArgs], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  return result.status ?? 1;
}

function parsePositiveInt(raw, fallback) {
  if (raw == null || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function chunk(values, size) {
  const chunks = [];
  for (let start = 0; start < values.length; start += size) {
    chunks.push(values.slice(start, start + size));
  }
  return chunks;
}

function listTestFiles() {
  return walk(ROOT)
    .map((path) => relative(ROOT, path).replaceAll('\\', '/'))
    .filter(isIncludedTestFile)
    .sort();
}

function walk(dir) {
  const entries = readdirSync(dir).flatMap((entry) => {
    if (entry === 'node_modules' || entry === '.git') return [];
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return walk(path);
    return stat.isFile() ? [path] : [];
  });
  return entries;
}

function isIncludedTestFile(path) {
  return (
    /^packages\/[^/]+\/src\/.*\.test\.ts$/u.test(path)
    || /^bench\/src\/.*\.test\.ts$/u.test(path)
    || /^scripts\/.*\.test\.ts$/u.test(path)
    || /^tests\/.*\.test\.ts$/u.test(path)
  );
}
