#!/usr/bin/env npx tsx
import { execSync, spawn } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import {
  headerBox,
  table,
  progressBar,
  alert,
} from '@flyingrobots/bijou';

const ctx = initDefaultContext();
const JOBS = parseInt(process.env['JOBS'] ?? '8', 10);
const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
type JobKind = 'native' | 'vhs';

interface RecordJob {
  example: string;
  kind: JobKind;
  path: string;
}

const args = process.argv.slice(2);
let jobs: RecordJob[];

if (args.length > 0) {
  jobs = args
    .map(buildJob)
    .filter((job): job is RecordJob => {
      if (job == null) return false;
      return true;
    });
} else {
  jobs = readdirSync(resolve(ROOT, 'examples'))
    .map(buildJob)
    .filter((job): job is RecordJob => job != null)
    .sort((a, b) => a.example.localeCompare(b.example));
}

if (jobs.length === 0) {
  console.log(alert('No recordable examples found.', { variant: 'error', ctx }));
  process.exit(1);
}

const nativeCount = jobs.filter((job) => job.kind === 'native').length;
console.log(headerBox('record-gifs', {
  detail: `${String(jobs.length)} jobs · ${String(nativeCount)} native · ${String(JOBS)} parallel`,
  ctx,
}));
console.log();

process.stdout.write(`  Building packages...`);
execSync('npx tsc -b', { cwd: ROOT, stdio: 'ignore' });
console.log(' done');
console.log();

interface Result {
  name: string;
  status: 'success' | 'error';
  elapsed: number;
}

const results: Result[] = [];
let completed = 0;

function renderProgress(): void {
  const pct = jobs.length > 0 ? (completed / jobs.length) * 100 : 100;
  const bar = progressBar(pct, { width: 40, ctx });
  process.stdout.write(`\r\x1b[K  ${bar}  ${String(completed)}/${String(jobs.length)}`);
}

function recordOne(job: RecordJob): Promise<Result> {
  const name = job.example;
  const start = Date.now();

  return new Promise<Result>((resolve) => {
    if (job.kind === 'native') {
      recordNative(job.path)
        .then(() => { finish('success'); })
        .catch(() => { finish('error'); });
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

    function finish(status: Result['status']) {
      const elapsed = Date.now() - start;
      const result: Result = { name, status, elapsed };
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

function buildJob(name: string): RecordJob | null {
  const nativePath = resolve(ROOT, 'examples', name, 'record.ts');
  if (existsSync(nativePath)) {
    return { example: name, kind: 'native', path: nativePath };
  }

  const tapePath = resolve(ROOT, 'examples', name, 'demo.tape');
  if (existsSync(tapePath)) {
    return { example: name, kind: 'vhs', path: tapePath };
  }
  if (args.length > 0) {
    console.log(alert(`${name}: no record.ts or demo.tape found, skipping`, { variant: 'warning', ctx }));
  }
  return null;
}

type NativeRecorder = () => void | Promise<void>;

function isNativeRecorder(value: unknown): value is NativeRecorder {
  return typeof value === 'function';
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

async function recordNative(entryPath: string): Promise<void> {
  const module: unknown = await import(pathToFileURL(entryPath).href);
  const recorder = isObjectRecord(module) ? module['default'] : undefined;
  if (!isNativeRecorder(recorder)) {
    throw new Error(`${entryPath} does not export a default recorder function`);
  }
  await recorder();
}
await runAll();
const successes = results.filter(r => r.status === 'success');
const failures = results.filter(r => r.status === 'error');
results.sort((a, b) => a.name.localeCompare(b.name));
const rows = results.map(r => [
  r.name,
  r.status === 'success' ? '✅' : '❌',
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
  const names = failures.map(f => f.name);
  const lines: string[] = [`${String(failures.length)} failed:`];
  let line = ' ';
  for (const name of names) {
    if (line.length + name.length + 2 > 70) {
      lines.push(line);
      line = '  ' + name + ',';
    } else {
      line += ' ' + name + ',';
    }
  }
  lines.push(line.replace(/,$/, ''));
  console.log(alert(lines.join('\n'), { variant: 'error', ctx }));
} else {
  const totalTime = results.reduce((s, r) => s + r.elapsed, 0);
  console.log(alert(
    `All ${String(successes.length)} GIFs recorded (${(totalTime / 1000).toFixed(1)}s total, ${(Math.max(...results.map(r => r.elapsed)) / 1000).toFixed(1)}s wall)`,
    { variant: 'success', ctx },
  ));
}
