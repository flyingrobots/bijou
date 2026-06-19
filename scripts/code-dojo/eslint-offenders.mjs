#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "./git.mjs";
import { runEslintJson } from "./eslint-results.mjs";

const fileContextBaselinePath = "scripts/code-dojo/baselines/file-context.json";
const defaultLimit = 40;

function parseArgs(args) {
  const options = { json: false, limit: defaultLimit };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--limit") {
      const value = args[index + 1];
      if (value == null) throw new Error("--limit requires a positive integer");
      options.limit = parseLimit(value);
      index += 1;
      continue;
    }
    if (arg?.startsWith("--limit=")) {
      options.limit = parseLimit(arg.slice("--limit=".length));
      continue;
    }

    throw new Error(`Unknown eslint-offenders option: ${arg ?? ""}`);
  }

  return options;
}

function parseLimit(value) {
  if (!/^[1-9]\d*$/u.test(value)) throw new Error("--limit requires a positive integer");
  return Number(value);
}

function readFileContextBaseline(root) {
  const parsed = JSON.parse(readFileSync(path.join(root, fileContextBaselinePath), "utf8"));
  if (parsed.schema !== "code-dojo.file-context-baseline.v1" || !Array.isArray(parsed.files)) {
    throw new Error(`${fileContextBaselinePath} is not a code-dojo.file-context-baseline.v1 file`);
  }
  return new Map(parsed.files.map((entry) => [entry.path, entry]));
}

function relativePath(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function countLines(content) {
  return content.split(/\r?\n/u).length;
}

function ruleCounts(messages) {
  const counts = new Map();
  for (const message of messages) {
    const ruleId = message.ruleId ?? "fatal";
    counts.set(ruleId, (counts.get(ruleId) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([ruleId, count]) => ({ ruleId, count }))
    .sort((a, b) => b.count - a.count || a.ruleId.localeCompare(b.ruleId));
}

function buildRows(root, results, baseline) {
  const rows = [];

  for (const result of results) {
    const count = result.messages?.length ?? 0;
    if (count === 0) continue;

    const file = relativePath(root, result.filePath);
    const absolutePath = path.join(root, file);
    if (!existsSync(absolutePath)) continue;

    const content = readFileSync(absolutePath, "utf8");
    const bytes = statSync(absolutePath).size;
    const lines = countLines(content);
    const baselineEntry = baseline.get(file);

    rows.push({
      path: file,
      count,
      errors: result.errorCount ?? 0,
      warnings: result.warningCount ?? 0,
      lines,
      bytes,
      baseline: baselineEntry == null ? null : {
        lines: baselineEntry.lines,
        bytes: baselineEntry.bytes,
        lineHeadroom: baselineEntry.lines - lines,
        byteHeadroom: baselineEntry.bytes - bytes,
      },
      rules: ruleCounts(result.messages ?? []),
    });
  }

  return rows.sort((a, b) => b.count - a.count || a.path.localeCompare(b.path));
}

function formatBaseline(row) {
  if (row.baseline == null) return "not-baselined";
  return `${String(row.baseline.lines)}/${String(row.baseline.bytes)} headroom ${String(row.baseline.lineHeadroom)}/${String(row.baseline.byteHeadroom)}`;
}

function formatRules(row) {
  return row.rules
    .slice(0, 5)
    .map((rule) => `${rule.ruleId}:${String(rule.count)}`)
    .join(" | ");
}

function printRows(rows) {
  for (const row of rows) {
    process.stdout.write(`${String(row.count).padStart(4)} ${row.path} ${String(row.lines)}/${String(row.bytes)} ${formatBaseline(row)}\n`);
    process.stdout.write(`     ${formatRules(row)}\n`);
  }
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const root = repoRoot();
    const baseline = readFileContextBaseline(root);
    const rows = buildRows(root, runEslintJson(root), baseline).slice(0, options.limit);

    if (options.json) {
      process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
    } else {
      printRows(rows);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`eslint-offenders: ${message}\n`);
    process.exit(1);
  }
}

main();
