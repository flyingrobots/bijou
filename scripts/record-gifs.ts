#!/usr/bin/env npx tsx
/**
 * Record all VHS demo tapes in parallel, with bijou-powered output.
 *
 * Usage:
 *   npx tsx scripts/record-gifs.ts              # record all
 *   npx tsx scripts/record-gifs.ts dag box      # specific examples
 *   JOBS=4 npx tsx scripts/record-gifs.ts       # limit parallelism
 */

import { execSync, spawn } from 'node:child_process';
import { readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, basename, dirname } from 'node:path';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import {
  headerBox,
  badge,
  separator,
  table,
  progressBar,
  alert,
} from '@flyingrobots/bijou';

const ctx = initDefaultContext();
const JOBS = parseInt(process.env['JOBS'] ?? '8', 10);
const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');

// ── Collect tapes ──────────────────────────────────────────────────

const args = process.argv.slice(2);
let tapes: string[];

if (args.length > 0) {
  tapes = args
    .map(name => resolve(ROOT, 'examples', name, 'demo.tape'))
    .filter(tape => {
      if (!existsSync(tape)) {
        console.log(alert(`${basename(dirname(tape))}: demo.tape not found, skipping`, { variant: 'warning', ctx }));
        return false;
      }
      return true;
    });
} else {
  tapes = readdirSync(resolve(ROOT, 'examples'))
    .filter(d => existsSync(resolve(ROOT, 'examples', d, 'demo.tape')))
    .map(d => resolve(ROOT, 'examples', d, 'demo.tape'))
    .sort();
}

if (tapes.length === 0) {
  console.log(alert('No tapes found.', { variant: 'error', ctx }));
  process.exit(1);
}

// ── Build ──────────────────────────────────────────────────────────

console.log(headerBox('record-gifs', { detail: `${tapes.length} tapes · ${JOBS} parallel jobs`, ctx }));
console.log();

process.stdout.write(`  Building packages...`);
execSync('npx tsc -b', { cwd: ROOT, stdio: 'ignore' });
console.log(' done');
console.log();

// ── Record in parallel ─────────────────────────────────────────────

interface Result {
  name: string;
  status: 'success' | 'error';
  elapsed: number;
}

const results: Result[] = [];
let completed = 0;

function renderProgress(): void {
  const pct = tapes.length > 0 ? (completed / tapes.length) * 100 : 100;
  const bar = progressBar(pct, { width: 40, ctx });
  process.stdout.write(`\r\x1b[K  ${bar}  ${completed}/${tapes.length}`);
}

function recordOne(tape: string): Promise<Result> {
  const name = basename(dirname(tape));
  const start = Date.now();

  return new Promise<Result>((resolve) => {
    const proc = spawn('vhs', [tape], {
      cwd: ROOT,
      stdio: ['ignore', 'ignore', 'ignore'],
    });

    proc.on('close', (code) => {
      const elapsed = Date.now() - start;
      const status = code === 0 ? 'success' : 'error';
      const result: Result = { name, status, elapsed };
      results.push(result);
      completed++;
      renderProgress();
      resolve(result);
    });

    proc.on('error', () => {
      const elapsed = Date.now() - start;
      const result: Result = { name, status: 'error', elapsed };
      results.push(result);
      completed++;
      renderProgress();
      resolve(result);
    });
  });
}

// Run with concurrency limit
async function runAll(): Promise<void> {
  renderProgress();

  const queue = [...tapes];
  const running: Promise<void>[] = [];

  async function next(): Promise<void> {
    while (queue.length > 0) {
      const tape = queue.shift()!;
      await recordOne(tape);
    }
  }

  for (let i = 0; i < Math.min(JOBS, tapes.length); i++) {
    running.push(next());
  }

  await Promise.all(running);
  process.stdout.write('\n\n');
}

await runAll();

// ── Summary ────────────────────────────────────────────────────────

const successes = results.filter(r => r.status === 'success');
const failures = results.filter(r => r.status === 'error');

results.sort((a, b) => a.name.localeCompare(b.name));

const rows = results.map(r => [
  r.name,
  r.status === 'success' ? '✓' : '✗',
  `${(r.elapsed / 1000).toFixed(1)}s`,
]);

console.log(table({
  columns: [
    { header: 'Example' },
    { header: 'Status' },
    { header: 'Time', align: 'right' as const },
  ],
  rows,
  ctx,
}));
console.log();

if (failures.length > 0) {
  console.log(alert(
    `${failures.length} failed: ${failures.map(f => f.name).join(', ')}`,
    { variant: 'error', ctx },
  ));
} else {
  const totalTime = results.reduce((s, r) => s + r.elapsed, 0);
  console.log(alert(
    `All ${successes.length} GIFs recorded (${(totalTime / 1000).toFixed(1)}s total, ${(Math.max(...results.map(r => r.elapsed)) / 1000).toFixed(1)}s wall)`,
    { variant: 'success', ctx },
  ));
}
