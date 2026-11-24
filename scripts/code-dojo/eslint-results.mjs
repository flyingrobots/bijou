#!/usr/bin/env node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const lintTargets = [
  "bench/**/*.ts",
  "examples/**/*.ts",
  "examples/web-gpu/src/main.tsx",
  "examples/web-gpu/src/chrome/**/*.tsx",
  "examples/web-gpu/src/dom/**/*.tsx",
  "packages/**/*.ts",
  "scripts/**/*.ts",
  "tests/**/*.ts",
  "vitest.config.ts",
];

export function eslintCacheArgs(root, name = ".eslintcache") {
  mkdirSync(path.join(root, ".cache", "eslint"), { recursive: true });
  return cacheArgs(name);
}

function cacheArgs(name) {
  return ["--cache", "--cache-strategy", "content", "--cache-location", `.cache/eslint/${name}`];
}

/**
 * Pure: plans the runs and touches no file. One ESLint process per target, each with a cache of its own. A single
 * process over every target holds the typed program for the whole tree at
 * once and runs out of V8 heap; a process per target is bounded by the
 * largest target.
 */
export function eslintInvocations(_root, targets = lintTargets) {
  return targets.map((target, index) => ({
    target,
    args: [
      "--format", "json", "--no-warn-ignored",
      ...cacheArgs(`.eslintcache-${String(index)}-${target.replace(/[^a-z0-9]+/gi, "_")}`),
      target,
    ],
  }));
}

/** Every file once, in first-seen order: two targets may match the same file. */
export function mergeEslintResults(groups) {
  const byPath = new Map();
  for (const group of groups) {
    for (const result of group) if (!byPath.has(result.filePath)) byPath.set(result.filePath, result);
  }
  return [...byPath.values()];
}

export function runEslintJson(root, targets = lintTargets) {
  const directory = mkdtempSync(path.join(tmpdir(), "bijou-eslint-"));
  const eslintCommand = localEslintCommand(root);
  mkdirSync(path.join(root, ".cache", "eslint"), { recursive: true });
  try {
    const groups = eslintInvocations(root, targets).map((plan, index) => {
      const outputPath = path.join(directory, `eslint-${String(index)}.json`);
      const result = spawnSync(eslintCommand, ["--output-file", outputPath, ...plan.args], {
        cwd: root,
        encoding: "utf8",
        shell: process.platform === "win32",
      });
      if (result.status !== 0 && result.status !== 1) {
        process.stderr.write(`ESLint failed on ${plan.target}\n`);
        process.stderr.write(result.stderr ?? "");
        process.stderr.write(result.stdout ?? "");
        process.exit(result.status ?? 1);
      }
      return JSON.parse(readFileSync(outputPath, "utf8"));
    });
    return mergeEslintResults(groups);
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
}

export function localEslintCommand(root) {
  const executable = process.platform === "win32" ? "eslint.cmd" : "eslint";
  const localPath = path.join(root, "node_modules", ".bin", executable);
  return existsSync(localPath) ? localPath : "eslint";
}

export function summarizeEslintResults(results) {
  const rules = new Map();
  let total = 0;
  let errors = 0;
  let warnings = 0;

  for (const result of results) {
    errors += result.errorCount ?? 0;
    warnings += result.warningCount ?? 0;
    for (const message of result.messages ?? []) {
      total += 1;
      const ruleId = message.ruleId ?? "fatal";
      rules.set(ruleId, (rules.get(ruleId) ?? 0) + 1);
    }
  }

  return { total, errors, warnings, rules };
}

/** Per-file diagnostic counts, counted exactly as summarizeEslintResults counts `total`. */
export function summarizeEslintFiles(results, root) {
  const files = [];
  for (const result of results) {
    const count = (result.messages ?? []).length;
    if (count === 0) continue;
    const relative = path.relative(root, result.filePath).split(path.sep).join("/");
    files.push({ path: relative, count });
  }
  return files.sort((a, b) => b.count - a.count || a.path.localeCompare(b.path));
}
