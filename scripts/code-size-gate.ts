#!/usr/bin/env tsx

import { readdirSync, readFileSync } from 'node:fs';
import { extname, posix as posixPath, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface CodeSizeBaselineEntry {
  readonly path: string;
  readonly lines: number;
}

export interface CodeSizeFile {
  readonly path: string;
  readonly lines: number;
}

export interface CodeSizeGateResult {
  readonly ok: boolean;
  readonly files: readonly CodeSizeFile[];
  readonly violations: readonly string[];
}

export interface CodeSizeGateOptions {
  readonly cwd?: string;
  readonly files?: readonly CodeSizeFile[];
  readonly baseline?: readonly CodeSizeBaselineEntry[];
}
const S = String;
const CODE_SIZE_HARD_LIMIT = 1_000;
const CODE_SIZE_RATCHET_LIMIT = 500;
const SOURCE_EXTENSIONS = new Set(['.cjs', '.js', '.mjs', '.ts', '.tsx']);
const SKIPPED_DIRECTORIES = new Set([
  '.git',
  'coverage',
  'dist',
  'node_modules',
]);

export const CODE_SIZE_BASELINE: readonly CodeSizeBaselineEntry[] = Object.freeze([
  { path: 'examples/docs/stories.ts', lines: 4558 },
  { path: 'examples/docs/app.ts', lines: 3306 },
  { path: 'packages/bijou-tui/src/app-frame.ts', lines: 2847 },
  { path: 'packages/bijou/src/core/components/table.ts', lines: 990 },
  { path: 'packages/bijou-tui/src/runtime-engine.ts', lines: 975 },
  { path: 'packages/bijou/src/core/render/differ.ts', lines: 901 },
  { path: 'packages/bijou/src/core/ui-scene-ir.ts', lines: 889 },
  { path: 'packages/bijou-tui/src/app-frame-overlays.ts', lines: 877 },
  { path: 'examples/docs/i18n-debt.ts', lines: 831 },
  { path: 'packages/bijou/src/ports/surface.ts', lines: 823 },
  { path: 'packages/bijou-tui/src/app-frame-render.ts', lines: 763 },
  { path: 'scripts/pr-review-status.ts', lines: 754 },
  { path: 'examples/image-viewer/main.ts', lines: 740 },
  { path: 'examples/notifications/main.ts', lines: 725 },
  { path: 'examples/_shared/canonical-app.ts', lines: 724 },
  { path: 'packages/bijou-tui-app/src/index.ts', lines: 692 },
  { path: 'packages/bijou/src/core/components/dag-render.ts', lines: 692 },
  { path: 'packages/bijou-tui/src/driver.ts', lines: 679 },
  { path: 'examples/perf-gradient/main.ts', lines: 676 },
  { path: 'packages/bijou-tui/src/runtime.ts', lines: 669 },
  { path: 'packages/bijou-tui/src/timeline.ts', lines: 632 },
  { path: 'examples/docs/storybook-app.ts', lines: 607 },
  { path: 'packages/bijou-i18n/src/runtime.ts', lines: 565 },
  { path: 'scripts/smoke-all-examples-lib.ts', lines: 558 },
  { path: 'packages/bijou-tui/src/app-frame-actions.ts', lines: 557 },
  { path: 'packages/bijou-tui/src/eventbus.ts', lines: 534 },
]);

export function evaluateCodeSizeGate(options: CodeSizeGateOptions = {}): CodeSizeGateResult {
  const files = [...(options.files ?? collectCodeSizeFiles(options.cwd ?? repoRoot()))]
    .sort((a, b) => b.lines - a.lines || a.path.localeCompare(b.path));
  const baseline = new Map((options.baseline ?? CODE_SIZE_BASELINE).map((entry) => [entry.path, entry.lines]));
  const violations: string[] = [];

  for (const file of files) {
    const allowedLines = baseline.get(file.path);

    if (file.lines > CODE_SIZE_HARD_LIMIT) {
      if (allowedLines == null) {
        violations.push(`${file.path} has ${S(file.lines)} lines; hard limit ${S(CODE_SIZE_HARD_LIMIT)}`);
        continue;
      }
      if (file.lines > allowedLines) {
        violations.push(`${file.path} has ${S(file.lines)} lines; legacy ${S(allowedLines)}`);
      }
      continue;
    }

    if (file.lines <= CODE_SIZE_RATCHET_LIMIT) continue;
    if (allowedLines == null) {
      violations.push(`${file.path} has ${S(file.lines)} lines; over ${S(CODE_SIZE_RATCHET_LIMIT)} needs ratchet`);
      continue;
    }
    if (file.lines > allowedLines) {
      violations.push(`${file.path} has ${S(file.lines)} lines; ratchet ${S(allowedLines)}`);
    }
  }

  return Object.freeze({
    ok: violations.length === 0,
    files: Object.freeze(files.map((file) => Object.freeze({ ...file }))),
    violations: Object.freeze(violations),
  });
}

export function collectCodeSizeFiles(cwd: string): readonly CodeSizeFile[] {
  const files: CodeSizeFile[] = [];

  function visit(relativeDirectory: string): void {
    const absoluteDirectory = resolve(cwd, relativeDirectory);
    for (const entry of readdirSync(absoluteDirectory, { withFileTypes: true })) {
      const relativePath = relativeDirectory === ''
        ? entry.name
        : posixPath.join(relativeDirectory, entry.name);
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRECTORIES.has(entry.name)) visit(relativePath);
        continue;
      }
      if (!entry.isFile() || !isSourceFile(relativePath)) continue;
      files.push(Object.freeze({
        path: relativePath,
        lines: countLines(readFileSync(resolve(cwd, relativePath), 'utf8')),
      }));
    }
  }

  visit('');
  return Object.freeze(files.sort((a, b) => a.path.localeCompare(b.path)));
}

export function formatCodeSizeGateResult(result: CodeSizeGateResult): string {
  if (result.ok) {
    const ratcheted = result.files.filter((file) => file.lines > CODE_SIZE_RATCHET_LIMIT).length;
    const legacyHardLimit = result.files.filter((file) => file.lines > CODE_SIZE_HARD_LIMIT).length;
    return `code-size-gate: ok (${S(ratcheted)} files over ${S(CODE_SIZE_RATCHET_LIMIT)} lines; ${S(legacyHardLimit)} legacy hard-limit files over ${S(CODE_SIZE_HARD_LIMIT)})\n`;
  }

  return [
    `code-size-gate: failed (${S(result.violations.length)} violation${result.violations.length === 1 ? '' : 's'})`,
    ...result.violations.map((violation) => `- ${violation}`),
    '',
  ].join('\n');
}

function isSourceFile(path: string): boolean {
  if (path.endsWith('.d.ts')) return false;
  return SOURCE_EXTENSIONS.has(extname(path));
}

function countLines(text: string): number {
  if (text.length === 0) return 0;
  return text.endsWith('\n') ? text.split('\n').length - 1 : text.split('\n').length;
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

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
