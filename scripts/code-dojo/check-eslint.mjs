#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "./git.mjs";
import { runEslintJson, summarizeEslintResults } from "./eslint-results.mjs";

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

function formatRule(ruleId, count, baselineCount) {
  return `${ruleId}: ${count} > ${baselineCount}`;
}

function main() {
  const root = repoRoot();
  const baseline = readBaseline(root);
  const summary = summarizeEslintResults(runEslintJson(root));
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
