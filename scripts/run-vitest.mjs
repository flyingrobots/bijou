#!/usr/bin/env node
import './docker-seal/require-docker.mjs';
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assignShards, chunkFiles, isIncludedTestFile, parseShard, parseWeights } from './vitest-shards.mjs';

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

// BIJOU_VITEST_SHARD=k/n runs the k-th of n shares of the chunks, so n runners can split the suite.
let shard;
try {
  shard = parseShard(process.env.BIJOU_VITEST_SHARD);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(2);
}
const files = listTestFiles();
// A shard's files are dealt by measured weight (scripts/vitest-weights.json), so shards take similar time.
let chunks = chunkFiles(files, CHUNK_SIZE);
if (shard) {
  const weights = parseWeights(readFileSync(resolve(ROOT, 'scripts/vitest-weights.json'), 'utf8'));
  const mine = assignShards(files, weights, shard.count)[shard.index - 1];
  chunks = chunkFiles(mine.files, CHUNK_SIZE);
  process.stdout.write(`vitest shard ${shard.index}/${shard.count}: ${mine.files.length} of ${files.length} files, about ${mine.seconds} s of measured test time\n`);
}

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
