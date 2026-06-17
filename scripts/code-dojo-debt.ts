#!/usr/bin/env tsx

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CODE_SIZE_BASELINE,
  type CodeSizeBaselineEntry,
} from './code-size-gate.js';

export const CODE_DOJO_GOALPOST_BURNDOWN_STEP = 50;

const CODE_SIZE_HARD_LIMIT = 1_000;

export interface CodeDojoDebtInput {
  readonly fileContextEntries: readonly unknown[];
  readonly mockBanViolations: readonly unknown[];
  readonly codeSizeBaseline: readonly CodeSizeBaselineEntry[];
}

export interface CodeDojoDebtSummary {
  readonly fileContextViolations: number;
  readonly mockBanViolations: number;
  readonly codeSizeViolations: number;
  readonly codeSizeHardLimitViolations: number;
  readonly totalViolations: number;
  readonly goalpostReduction: number;
  readonly nextGoalpostTarget: number;
}

interface FileContextBaselineFile {
  readonly path: string;
  readonly lines: number;
  readonly bytes: number;
}

interface FileContextBaseline {
  readonly schema: string;
  readonly files: readonly FileContextBaselineFile[];
}

interface MockBanBaselineViolation {
  readonly file: string;
  readonly message: string;
  readonly source: string;
}

interface MockBanBaseline {
  readonly schema: string;
  readonly violations: readonly MockBanBaselineViolation[];
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fileContextBaselinePath = 'scripts/code-dojo/baselines/file-context.json';
const mockBanBaselinePath = 'scripts/code-dojo/baselines/mock-ban.json';

export function summarizeCodeDojoDebt(input: CodeDojoDebtInput): CodeDojoDebtSummary {
  const fileContextViolations = input.fileContextEntries.length;
  const mockBanViolations = input.mockBanViolations.length;
  const codeSizeViolations = input.codeSizeBaseline.length;
  const totalViolations = fileContextViolations + mockBanViolations + codeSizeViolations;

  return Object.freeze({
    fileContextViolations,
    mockBanViolations,
    codeSizeViolations,
    codeSizeHardLimitViolations: input.codeSizeBaseline.filter((entry) => entry.lines > CODE_SIZE_HARD_LIMIT).length,
    totalViolations,
    goalpostReduction: CODE_DOJO_GOALPOST_BURNDOWN_STEP,
    nextGoalpostTarget: Math.max(0, totalViolations - CODE_DOJO_GOALPOST_BURNDOWN_STEP),
  });
}

export function loadCodeDojoDebtSummary(root: string = ROOT): CodeDojoDebtSummary {
  const fileContextBaseline = readFileContextBaseline(resolve(root, fileContextBaselinePath));
  const mockBanBaseline = readMockBanBaseline(resolve(root, mockBanBaselinePath));

  return summarizeCodeDojoDebt({
    fileContextEntries: fileContextBaseline.files,
    mockBanViolations: mockBanBaseline.violations,
    codeSizeBaseline: CODE_SIZE_BASELINE,
  });
}

export function formatCodeDojoDebt(summary: CodeDojoDebtSummary): string {
  return [
    `Code Dojo debt: ${summary.totalViolations} violation${summary.totalViolations === 1 ? '' : 's'}`,
    `- file/context baseline: ${summary.fileContextViolations}`,
    `- mock-ban baseline: ${summary.mockBanViolations}`,
    `- code-size baseline: ${summary.codeSizeViolations} (${summary.codeSizeHardLimitViolations} over hard limit)`,
    `Goalpost policy: every met goalpost must remove at least ${summary.goalpostReduction} violations until zero.`,
    `Next goalpost target from this count: <= ${summary.nextGoalpostTarget} violations.`,
    '',
  ].join('\n');
}

function readFileContextBaseline(path: string): FileContextBaseline {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as FileContextBaseline;
  if (parsed.schema !== 'code-dojo.file-context-baseline.v1' || !Array.isArray(parsed.files)) {
    throw new Error(`${path} is not a code-dojo.file-context-baseline.v1 file`);
  }
  return parsed;
}

function readMockBanBaseline(path: string): MockBanBaseline {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as MockBanBaseline;
  if (parsed.schema !== 'code-dojo.mock-ban-baseline.v1' || !Array.isArray(parsed.violations)) {
    throw new Error(`${path} is not a code-dojo.mock-ban-baseline.v1 file`);
  }
  return parsed;
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
    process.stderr.write(`Code Dojo debt exceeds ceiling ${max}: ${summary.totalViolations}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
