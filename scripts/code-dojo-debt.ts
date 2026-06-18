#!/usr/bin/env tsx

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CODE_SIZE_BASELINE,
  type CodeSizeBaselineEntry,
} from './code-size-gate.js';
import { loadCodeDojoBaselineCounts } from './code-dojo-debt-baselines.js';

export const CODE_DOJO_GOALPOST_BURNDOWN_STEP = 50;

const CODE_SIZE_HARD_LIMIT = 1_000;

export interface CodeDojoDebtInput {
  readonly fileContextEntries: readonly unknown[];
  readonly mockBanViolations: readonly unknown[];
  readonly codeSizeBaseline: readonly CodeSizeBaselineEntry[];
  readonly eslintViolations: number;
}

export interface CodeDojoDebtSummary {
  readonly fileContextViolations: number;
  readonly mockBanViolations: number;
  readonly codeSizeViolations: number;
  readonly codeSizeHardLimitViolations: number;
  readonly eslintViolations: number;
  readonly totalViolations: number;
  readonly goalpostReduction: number;
  readonly nextGoalpostTarget: number;
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function summarizeCodeDojoDebt(input: CodeDojoDebtInput): CodeDojoDebtSummary {
  const fileContextViolations = input.fileContextEntries.length;
  const mockBanViolations = input.mockBanViolations.length;
  const codeSizeViolations = input.codeSizeBaseline.length;
  const eslintViolations = input.eslintViolations;
  const totalViolations = fileContextViolations + mockBanViolations + codeSizeViolations + eslintViolations;

  return Object.freeze({
    fileContextViolations,
    mockBanViolations,
    codeSizeViolations,
    codeSizeHardLimitViolations: input.codeSizeBaseline.filter((entry) => entry.lines > CODE_SIZE_HARD_LIMIT).length,
    eslintViolations,
    totalViolations,
    goalpostReduction: CODE_DOJO_GOALPOST_BURNDOWN_STEP,
    nextGoalpostTarget: Math.max(0, totalViolations - CODE_DOJO_GOALPOST_BURNDOWN_STEP),
  });
}

export function loadCodeDojoDebtSummary(root: string = ROOT): CodeDojoDebtSummary {
  const baselineCounts = loadCodeDojoBaselineCounts(root);

  return summarizeCodeDojoDebt({
    fileContextEntries: baselineCounts.fileContextEntries,
    mockBanViolations: baselineCounts.mockBanViolations,
    codeSizeBaseline: CODE_SIZE_BASELINE,
    eslintViolations: baselineCounts.eslintViolations,
  });
}

export function formatCodeDojoDebt(summary: CodeDojoDebtSummary): string {
  const totalViolations = String(summary.totalViolations);
  const fileContextViolations = String(summary.fileContextViolations);
  const mockBanViolations = String(summary.mockBanViolations);
  const codeSizeViolations = String(summary.codeSizeViolations);
  const codeSizeHardLimitViolations = String(summary.codeSizeHardLimitViolations);
  const eslintViolations = String(summary.eslintViolations);
  const goalpostReduction = String(summary.goalpostReduction);
  const nextGoalpostTarget = String(summary.nextGoalpostTarget);

  return [
    `Code Dojo debt: ${totalViolations} violation${summary.totalViolations === 1 ? '' : 's'}`,
    `- file/context baseline: ${fileContextViolations}`,
    `- mock-ban baseline: ${mockBanViolations}`,
    `- code-size baseline: ${codeSizeViolations} (${codeSizeHardLimitViolations} over hard limit)`,
    `- ESLint baseline: ${eslintViolations}`,
    `Goalpost policy: every met goalpost must remove at least ${goalpostReduction} violations until zero.`,
    `Next goalpost target from this count: <= ${nextGoalpostTarget} violations.`,
    '',
  ].join('\n');
}

function parseMax(args: readonly string[]): number | undefined {
  const maxIndex = args.indexOf('--max');
  if (maxIndex === -1) return undefined;

  const value = args[maxIndex + 1];
  if (value == null || !/^\d+$/u.test(value)) {
    throw new Error('--max requires a non-negative integer');
  }
  return Number(value);
}

function main(): void {
  const args = process.argv.slice(2);
  const max = parseMax(args);
  const json = args.includes('--json');
  const summary = loadCodeDojoDebtSummary();

  if (json) {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } else {
    process.stdout.write(formatCodeDojoDebt(summary));
  }

  if (max != null && summary.totalViolations > max) {
    process.stderr.write(`Code Dojo debt exceeds ceiling ${String(max)}: ${String(summary.totalViolations)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
