#!/usr/bin/env npx tsx
import { execSync, spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { headerBox, progressBar, alert } from '@flyingrobots/bijou';
import {
  discoverRecordJobs,
  recordNative,
  type RecordJob,
} from './record-gifs-jobs.js';
import {
  renderRecordSummary,
  type RecordResult,
} from './record-gifs-report.js';

const ctx = initDefaultContext();
const JOBS = parseInt(process.env['JOBS'] ?? '8', 10);
const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const jobs = discoverRecordJobs(ROOT, args, (message) => {
  console.log(alert(message, { variant: 'warning', ctx }));
});

if (jobs.length === 0) {
  console.log(
    alert('No recordable examples found.', { variant: 'error', ctx }),
  );
  process.exit(1);
}

const nativeCount = jobs.filter((job) => job.kind === 'native').length;
console.log(
  headerBox('record-gifs', {
    detail: `${String(jobs.length)} jobs · ${String(nativeCount)} native · ${String(JOBS)} parallel`,
    ctx,
  }),
);
console.log();

process.stdout.write(`  Building packages...`);
execSync('npx tsc -b', { cwd: ROOT, stdio: 'ignore' });
console.log(' done');
console.log();

const results: RecordResult[] = [];
let completed = 0;

function renderProgress(): void {
  const pct = jobs.length > 0 ? (completed / jobs.length) * 100 : 100;
  const bar = progressBar(pct, { width: 40, ctx });
  process.stdout.write(
    `\r\x1b[K  ${bar}  ${String(completed)}/${String(jobs.length)}`,
  );
}

function recordOne(job: RecordJob): Promise<RecordResult> {
  const name = job.example;
  const start = Date.now();

  return new Promise<RecordResult>((resolve) => {
    if (job.kind === 'native') {
      recordNative(job.path)
        .then(() => {
          finish('success');
        })
        .catch(() => {
          finish('error');
        });
      return;
    }

    const proc = spawn('vhs', [job.path], {
      cwd: ROOT,
      stdio: ['ignore', 'ignore', 'ignore'],
    });

    proc.on('close', (code) => {
      finish(code === 0 ? 'success' : 'error');
    });

    proc.on('error', () => {
      finish('error');
    });

    function finish(status: RecordResult['status']) {
      const elapsed = Date.now() - start;
      const result: RecordResult = { name, status, elapsed };
      results.push(result);
      completed++;
      renderProgress();
      resolve(result);
    }
  });
}

async function runAll(): Promise<void> {
  renderProgress();

  const queue = [...jobs];
  const running: Promise<void>[] = [];

  async function next(): Promise<void> {
    while (queue.length > 0) {
      const job = queue.shift();
      if (job === undefined) break;
      await recordOne(job);
    }
  }

  for (let i = 0; i < Math.min(JOBS, jobs.length); i++) {
    running.push(next());
  }

  await Promise.all(running);
  process.stdout.write('\n\n');
}

await runAll();
renderRecordSummary(results, ctx);
