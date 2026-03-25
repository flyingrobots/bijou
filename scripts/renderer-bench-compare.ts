#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  compareRendererBenchReports,
  formatRendererBenchComparison,
  type RendererBenchReport,
} from './renderer-bench-lib.js';
import { runRendererBenchmarks } from './renderer-bench.js';

interface RendererBenchCompareCliOptions {
  readonly baselinePath: string;
  readonly sampleCount: number;
  readonly warnThresholdPct: number;
  readonly failThresholdPct: number;
  readonly failOnRegression: boolean;
  readonly allowMachineMismatch: boolean;
}

function parseArgs(argv: readonly string[]): RendererBenchCompareCliOptions {
  let baselinePath = 'benchmarks/renderer-baseline.json';
  let sampleCount = 5;
  let warnThresholdPct = 10;
  let failThresholdPct = 20;
  let failOnRegression = false;
  let allowMachineMismatch = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--baseline') {
      baselinePath = argv[++i] ?? baselinePath;
      continue;
    }
    if (arg === '--samples') {
      sampleCount = Number.parseInt(argv[++i] ?? '', 10);
      continue;
    }
    if (arg === '--warn-threshold') {
      warnThresholdPct = Number.parseFloat(argv[++i] ?? '');
      continue;
    }
    if (arg === '--fail-threshold') {
      failThresholdPct = Number.parseFloat(argv[++i] ?? '');
      continue;
    }
    if (arg === '--fail-on-regression') {
      failOnRegression = true;
      continue;
    }
    if (arg === '--allow-machine-mismatch') {
      allowMachineMismatch = true;
      continue;
    }
    throw new Error(`unknown argument: ${arg}`);
  }

  return {
    baselinePath,
    sampleCount,
    warnThresholdPct,
    failThresholdPct,
    failOnRegression,
    allowMachineMismatch,
  };
}

function loadReport(path: string): RendererBenchReport {
  return JSON.parse(readFileSync(path, 'utf8')) as RendererBenchReport;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const baseline = loadReport(resolve(process.cwd(), options.baselinePath));
  const current = await runRendererBenchmarks({ sampleCount: options.sampleCount });
  const comparison = compareRendererBenchReports(baseline, current);

  process.stdout.write(
    formatRendererBenchComparison(comparison, {
      warnThresholdPct: options.warnThresholdPct,
      failThresholdPct: options.failThresholdPct,
    }) + '\n',
  );

  if (!comparison.machineMatches && !options.allowMachineMismatch) {
    process.stdout.write('comparison left informational because the machine fingerprint does not match the baseline.\n');
    return;
  }

  if (!options.failOnRegression) {
    return;
  }

  const regressed = comparison.rows.some((row) => row.deltaPct >= options.failThresholdPct);
  if (regressed) {
    process.exitCode = 1;
  }
}

if (process.argv[1] != null && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main();
}
