#!/usr/bin/env tsx

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CODE_SIZE_BASELINE } from './code-size-gate-baseline.js';
import { collectCodeSizeFiles } from './code-size-gate-files.js';
import type {
  CodeSizeGateOptions,
  CodeSizeGateResult,
} from './code-size-gate-types.js';
const S = String;
const CODE_SIZE_HARD_LIMIT = 1_000;
const CODE_SIZE_RATCHET_LIMIT = 500;

export function evaluateCodeSizeGate(
  options: CodeSizeGateOptions = {},
): CodeSizeGateResult {
  const files = [
    ...(options.files ?? collectCodeSizeFiles(options.cwd ?? repoRoot())),
  ].sort((a, b) => b.lines - a.lines || a.path.localeCompare(b.path));
  const baseline = new Map(
    (options.baseline ?? CODE_SIZE_BASELINE).map((entry) => [
      entry.path,
      entry.lines,
    ]),
  );
  const violations: string[] = [];

  for (const file of files) {
    const allowedLines = baseline.get(file.path);

    if (file.lines > CODE_SIZE_HARD_LIMIT) {
      if (allowedLines == null) {
        violations.push(
          `${file.path} has ${S(file.lines)} lines; hard limit ${S(CODE_SIZE_HARD_LIMIT)}`,
        );
        continue;
      }
      if (file.lines > allowedLines) {
        violations.push(
          `${file.path} has ${S(file.lines)} lines; legacy ${S(allowedLines)}`,
        );
      }
      continue;
    }

    if (file.lines <= CODE_SIZE_RATCHET_LIMIT) continue;
    if (allowedLines == null) {
      violations.push(
        `${file.path} has ${S(file.lines)} lines; over ${S(CODE_SIZE_RATCHET_LIMIT)} needs ratchet`,
      );
      continue;
    }
    if (file.lines > allowedLines) {
      violations.push(
        `${file.path} has ${S(file.lines)} lines; ratchet ${S(allowedLines)}`,
      );
    }
  }

  return Object.freeze({
    ok: violations.length === 0,
    files: Object.freeze(files.map((file) => Object.freeze({ ...file }))),
    violations: Object.freeze(violations),
  });
}

export function formatCodeSizeGateResult(result: CodeSizeGateResult): string {
  if (result.ok) {
    const ratcheted = result.files.filter(
      (file) => file.lines > CODE_SIZE_RATCHET_LIMIT,
    ).length;
    const legacyHardLimit = result.files.filter(
      (file) => file.lines > CODE_SIZE_HARD_LIMIT,
    ).length;
    return `code-size-gate: ok (${S(ratcheted)} files over ${S(CODE_SIZE_RATCHET_LIMIT)} lines; ${S(legacyHardLimit)} legacy hard-limit files over ${S(CODE_SIZE_HARD_LIMIT)})\n`;
  }

  return [
    `code-size-gate: failed (${S(result.violations.length)} violation${result.violations.length === 1 ? '' : 's'})`,
    ...result.violations.map((violation) => `- ${violation}`),
    '',
  ].join('\n');
}

function repoRoot(): string {
  return resolve(fileURLToPath(import.meta.url), '../..');
}

function main(): void {
  const result = evaluateCodeSizeGate();
  const output = formatCodeSizeGateResult(result);
  if (result.ok) {
    process.stdout.write(output);
    return;
  }
  process.stderr.write(output);
  process.exitCode = 1;
}

if (
  process.argv[1] != null &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  main();
}

export { CODE_SIZE_BASELINE } from './code-size-gate-baseline.js';
export { collectCodeSizeFiles } from './code-size-gate-files.js';
export type {
  CodeSizeBaselineEntry,
  CodeSizeFile,
  CodeSizeGateOptions,
  CodeSizeGateResult,
} from './code-size-gate-types.js';
