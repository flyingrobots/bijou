#!/usr/bin/env node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const lintTargets = [
  "bench/**/*.ts",
  "examples/**/*.ts",
  "packages/**/*.ts",
  "scripts/**/*.ts",
  "tests/**/*.ts",
  "vitest.config.ts",
];

export function eslintCacheArgs(root) {
  mkdirSync(path.join(root, ".cache", "eslint"), { recursive: true });
  return ["--cache", "--cache-strategy", "content", "--cache-location", ".cache/eslint/.eslintcache"];
}

export function runEslintJson(root, targets = lintTargets) {
  const directory = mkdtempSync(path.join(tmpdir(), "bijou-eslint-"));
  const outputPath = path.join(directory, "eslint.json");
  const eslintCommand = localEslintCommand(root);
  try {
    const result = spawnSync(
      eslintCommand,
      ["--format", "json", "--output-file", outputPath, "--no-warn-ignored", ...eslintCacheArgs(root), ...targets],
      {
        cwd: root,
        encoding: "utf8",
        shell: process.platform === "win32",
      },
    );
    if (result.status !== 0 && result.status !== 1) {
      process.stderr.write(result.stderr ?? "");
      process.stderr.write(result.stdout ?? "");
      process.exit(result.status ?? 1);
    }
    return JSON.parse(readFileSync(outputPath, "utf8"));
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
