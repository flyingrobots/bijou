#!/usr/bin/env node
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { repoRoot } from "./git.mjs";

const baselinePath = "scripts/code-dojo/baselines/eslint.json";
const schema = "code-dojo.eslint-baseline.v1";

function readBaseline(root) {
  const parsed = JSON.parse(readFileSync(path.join(root, baselinePath), "utf8"));
  if (parsed.schema !== schema || !Number.isInteger(parsed.total) || !Array.isArray(parsed.rules)) {
    throw new Error(`${baselinePath} is not a ${schema} file`);
  }
  return {
    total: parsed.total,
    errors: parsed.errors,
    warnings: parsed.warnings,
    rules: new Map(parsed.rules.map((rule) => [rule.ruleId, rule.count])),
  };
}

function summarize(results) {
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

function runEslint(root) {
  const directory = mkdtempSync(path.join(tmpdir(), "bijou-eslint-"));
  const outputPath = path.join(directory, "eslint.json");
  try {
    const result = spawnSync(
      "eslint",
      ["--format", "json", "--output-file", outputPath, "--no-warn-ignored", "."],
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

function formatRule(ruleId, count, baselineCount) {
  return `${ruleId}: ${count} > ${baselineCount}`;
}

function main() {
  const root = repoRoot();
  const baseline = readBaseline(root);
  const summary = summarize(runEslint(root));
  const failures = [];

  if (summary.total > baseline.total) failures.push(`total: ${summary.total} > ${baseline.total}`);
  if (summary.errors > baseline.errors) failures.push(`errors: ${summary.errors} > ${baseline.errors}`);
  if (summary.warnings > baseline.warnings) failures.push(`warnings: ${summary.warnings} > ${baseline.warnings}`);

  for (const [ruleId, count] of [...summary.rules.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const baselineCount = baseline.rules.get(ruleId) ?? 0;
    if (count > baselineCount) failures.push(formatRule(ruleId, count, baselineCount));
  }

  if (failures.length > 0) {
    process.stderr.write("\nCode Dojo: ESLint ratchet failed\n\n");
    for (const failure of failures) process.stderr.write(`- ${failure}\n`);
    process.stderr.write("\nFix the new lint findings or intentionally update the ESLint baseline.\n");
    process.exit(1);
  }

  process.stdout.write(`Code Dojo: ESLint ok (${summary.total} baselined findings held or reduced)\n`);
}

main();
