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
  { path: 'examples/docs/app.ts', lines: 5793 },
  { path: 'examples/docs/stories.ts', lines: 5007 },
  { path: 'packages/bijou-tui/src/app-frame.ts', lines: 2871 },
  { path: 'examples/docs/dogfood-blocks.ts', lines: 2638 },
  { path: 'packages/bijou/src/core/components/table.ts', lines: 990 },
  { path: 'packages/bijou-tui/src/notification.ts', lines: 966 },
  { path: 'packages/bijou-tui/src/runtime-engine.ts', lines: 965 },
  { path: 'packages/bijou-tui/src/overlay.ts', lines: 941 },
  { path: 'packages/bijou/src/core/binding.ts', lines: 935 },
  { path: 'packages/bijou-tui/src/index.ts', lines: 914 },
  { path: 'packages/bijou/src/core/render/differ.ts', lines: 907 },
  { path: 'packages/bijou/src/core/ui-scene-ir.ts', lines: 890 },
  { path: 'packages/bijou/src/index.ts', lines: 887 },
  { path: 'packages/bijou-tui/src/app-frame-overlays.ts', lines: 880 },
  { path: 'packages/bijou-tui/src/runtime-engine.test.ts', lines: 775 },
  { path: 'examples/docs/i18n-debt.ts', lines: 857 },
  { path: 'packages/bijou/src/core/graphql-bijou-block.ts', lines: 839 },
  { path: 'packages/bijou/src/ports/surface.ts', lines: 823 },
  { path: 'scripts/pr-review-status.ts', lines: 778 },
  { path: 'packages/bijou-tui/src/app-frame-render.ts', lines: 763 },
  { path: 'packages/bijou-tui/src/notification.test.ts', lines: 761 },
  { path: 'packages/bijou/src/core/standard-blocks.test.ts', lines: 759 },
  { path: 'examples/image-viewer/main.ts', lines: 747 },
  { path: 'examples/notifications/main.ts', lines: 742 },
  { path: 'examples/_shared/canonical-app.ts', lines: 735 },
  { path: 'packages/bijou-tui/src/dag-pane.ts', lines: 710 },
  { path: 'packages/bijou/src/core/binding.test.ts', lines: 706 },
  { path: 'packages/bijou-tui/src/driver.ts', lines: 696 },
  { path: 'packages/bijou-tui/src/runtime.ts', lines: 694 },
  { path: 'packages/bijou-tui-app/src/index.ts', lines: 693 },
  { path: 'packages/bijou/src/core/components/dag-render.ts', lines: 692 },
  { path: 'packages/bijou-tui/src/app-frame-render.test.ts', lines: 691 },
  { path: 'examples/perf-gradient/main.ts', lines: 680 },
  { path: 'packages/bijou-tui/src/eventbus.test.ts', lines: 643 },
  { path: 'packages/bijou-tui/src/viewport.ts', lines: 654 },
  { path: 'packages/bijou-tui/src/timeline.ts', lines: 636 },
  { path: 'packages/bijou-tui/src/raster-glyph.ts', lines: 622 },
  { path: 'packages/bijou-tui/src/focus-area.ts', lines: 622 },
  { path: 'packages/bijou/src/core/block-metadata.ts', lines: 612 },
  { path: 'examples/docs/storybook-app.ts', lines: 607 },
  { path: 'packages/bijou/src/core/schema-block.ts', lines: 606 },
  { path: 'packages/bijou/src/core/selection.ts', lines: 595 },
  { path: 'packages/bijou/src/core/layout/envelope.ts', lines: 570 },
  { path: 'packages/bijou-tui/src/app-frame-actions.ts', lines: 557 },
  { path: 'packages/bijou-tui/src/transition-shaders.test.ts', lines: 560 },
  { path: 'scripts/smoke-all-examples-lib.ts', lines: 558 },
  { path: 'packages/bijou/src/core/binding-lifecycle.ts', lines: 553 },
  { path: 'packages/bijou-i18n/src/runtime.test.ts', lines: 553 },
  { path: 'packages/bijou-i18n/src/runtime.ts', lines: 552 },
  { path: 'tests/cycles/DF-054/dogfood-late-family-six-pack.test.ts', lines: 544 },
  { path: 'packages/bijou/src/core/theme/dtcg.test.ts', lines: 532 },
  { path: 'packages/bijou-tui/src/eventbus.ts', lines: 535 },
  { path: 'packages/bijou-tui/src/focus-area.test.ts', lines: 533 },
  { path: 'packages/bijou-tui/src/transition-shaders.ts', lines: 516 },
  { path: 'tests/cycles/DF-069/dogfood-block-registry.test.ts', lines: 509 },
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
