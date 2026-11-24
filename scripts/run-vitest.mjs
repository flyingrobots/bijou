#!/usr/bin/env node
import './docker-seal/require-docker.mjs';
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assignShards, chunkFiles, isIncludedTestFile, needsIsolation, parseShard, parseWeights } from './vitest-shards.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VITEST = resolve(ROOT, 'node_modules', 'vitest', 'vitest.mjs');
const CHUNK_SIZE = parsePositiveInt(process.env.BIJOU_VITEST_CHUNK_SIZE, 48);
// Files that share a worker's modules start quickly, so their chunks are larger: fewer Vitest start-ups.
const SHARED_CHUNK_SIZE = parsePositiveInt(process.env.BIJOU_VITEST_SHARED_CHUNK_SIZE, 96);
// A file measured at this many seconds or more runs isolated: see the note where `isolated` is built.
const HEAVY_SECONDS = 2;
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
// Most of the suite's time was loading modules once per test file. A file that cannot change what
// other files see shares its worker's modules (isolation off); the rest keep a graph of their own.
// BIJOU_VITEST_ISOLATE=all runs every file isolated, to tell a real failure from a shared-state one.
const isolateAll = process.env.BIJOU_VITEST_ISOLATE === 'all';
const weights = parseWeights(readFileSync(resolve(ROOT, 'scripts/vitest-weights.json'), 'utf8'));
// A heavy file also keeps a process of its own. A worker that shares modules keeps what every file
// loaded, and a run of heavy files in one worker ended with "Worker exited unexpectedly"; a heavy
// file spends its time in its tests, so loading its own modules costs it little.
const isolated = new Set(files.filter((file) => isolateAll
  || (weights.files[file] ?? 0) >= HEAVY_SECONDS
  || needsIsolation(readFileSync(resolve(ROOT, file), 'utf8'))));
let mine = files;
if (shard) {
  // A shard's files are dealt by measured weight (scripts/vitest-weights.json), so shards take similar time.
  const share = assignShards(files, weights, shard.count, isolated)[shard.index - 1];
  mine = share.files;
  process.stdout.write(`vitest shard ${shard.index}/${shard.count}: ${mine.length} of ${files.length} files, about ${share.seconds} s of measured test time\n`);
}
const groups = [
  { label: 'shared modules', flags: ['--no-isolate'], chunks: chunkFiles(mine.filter((file) => !isolated.has(file)), SHARED_CHUNK_SIZE) },
  { label: 'isolated', flags: [], chunks: chunkFiles(mine.filter((file) => isolated.has(file)), CHUNK_SIZE) },
];
const total = groups.reduce((sum, group) => sum + group.chunks.length, 0);
let done = 0;
for (const group of groups) {
  for (const files of group.chunks) {
    done += 1;
    process.stdout.write(`\nvitest chunk ${done}/${total} (${files.length} files, ${group.label})\n`);
    const status = runVitest([...BASE_ARGS, ...group.flags, ...files]);
    if (status !== 0) {
      if (group.flags.length > 0) process.stdout.write('\nThis chunk ran with isolation off. If the failure is not in the test itself, run it again with BIJOU_VITEST_ISOLATE=all; a file that changes shared state needs a line `// vitest: isolate`.\n');
      process.exit(status);
    }
  }
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
