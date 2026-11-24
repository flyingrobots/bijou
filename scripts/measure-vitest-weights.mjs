#!/usr/bin/env node
// Measure how long each test file takes and write scripts/vitest-weights.json,
// which scripts/vitest-shards.mjs uses to give every CI shard a similar load.
// Run it in the sealed runner and export the file:
//   node scripts/docker-seal/run.mjs --export scripts/vitest-weights.json -- \
//     sh -c 'npm run build && node scripts/measure-vitest-weights.mjs'
// A stale file only makes the shards less even; it cannot drop or repeat a test.
import './docker-seal/require-docker.mjs';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FLOOR_SECONDS = 1;
const PER_FILE_SECONDS = 0.5;
const directory = mkdtempSync(join(tmpdir(), 'bijou-weights-'));
const report = join(directory, 'report.json');
try {
  const run = spawnSync(
    process.execPath,
    [resolve(ROOT, 'node_modules/vitest/vitest.mjs'), 'run', '--config', 'vitest.config.ts', '--testTimeout=60000', '--reporter=json', `--outputFile=${report}`],
    // The suite's own output is large; the sealed runner caps a run's log. Keep only a failure's tail.
    { cwd: ROOT, stdio: ['ignore', 'ignore', 'pipe'], encoding: 'utf8', maxBuffer: 1 << 28 },
  );
  if (run.status !== 0) process.stderr.write(`vitest exited ${String(run.status)}; weights are still written. ${(run.stderr ?? '').slice(-600)}\n`);
  const results = JSON.parse(readFileSync(report, 'utf8')).testResults;
  const files = {};
  for (const result of results) {
    const seconds = Math.round((result.endTime - result.startTime) / 100) / 10;
    if (seconds >= FLOOR_SECONDS) files[relative(ROOT, result.name).replaceAll('\\', '/')] = seconds;
  }
  const sorted = Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)));
  const light = results.length - Object.keys(sorted).length;
  const lightSeconds = results.reduce((sum, r) => sum + (r.endTime - r.startTime) / 1000, 0) - Object.values(sorted).reduce((sum, s) => sum + s, 0);
  const weights = {
    schema: 'bijou.vitest-weights/1',
    floorSeconds: FLOOR_SECONDS,
    defaultSeconds: Math.round((lightSeconds / Math.max(light, 1)) * 100) / 100,
    // Start-up and import cost of one test file before its first test, which a file's own time leaves out.
    // An estimate from CI chunk logs (48 files of about 1 s of tests took about 6 s on 2 workers), kept by hand.
    perFileSeconds: PER_FILE_SECONDS,
    files: sorted,
  };
  writeFileSync(resolve(ROOT, 'scripts/vitest-weights.json'), `${JSON.stringify(weights, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ event: 'weights-written', files: results.length, listed: Object.keys(sorted).length, vitestStatus: run.status })}\n`);
} finally {
  rmSync(directory, { force: true, recursive: true });
}
