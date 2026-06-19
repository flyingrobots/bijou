#!/usr/bin/env node
import path from "node:path";
import { runFastLane, runStep } from "./fast.mjs";
import { git, repoRoot } from "./git.mjs";

const sourceExtensions = new Set([".ts", ".tsx", ".mts", ".cts"]);
const lintRoots = ["bench/", "examples/", "packages/", "scripts/", "tests/"];

function parseBase(args) {
  if (args.length > 1) throw new Error("Usage: npm run code-dojo:changed -- [base-ref]");
  const [base = null] = args;
  if (base != null && base.startsWith("-")) throw new Error(`Unknown code-dojo:changed option: ${base}`);
  return base;
}

function isLintableSource(file) {
  const normalized = file.split(path.sep).join("/");
  if (normalized.endsWith(".d.ts")) return false;
  if (!sourceExtensions.has(path.extname(normalized))) return false;
  return normalized === "vitest.config.ts" || lintRoots.some((root) => normalized.startsWith(root));
}

function changedFiles(base) {
  const diffTarget = base == null ? "HEAD" : `${base}...HEAD`;
  const output = git(["diff", "--name-only", "--diff-filter=ACMR", diffTarget]);
  return output.length === 0 ? [] : output.split("\n").filter(Boolean).filter(isLintableSource).sort();
}

function main() {
  let base;
  try {
    base = parseBase(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`code-dojo:changed: ${message}\n`);
    process.exit(1);
  }

  const root = repoRoot();
  const files = changedFiles(base);
  if (files.length > 0) {
    runFastLane(root, files, "code-dojo:changed");
    return;
  }

  const label = base == null ? "against HEAD" : `since ${base}`;
  process.stdout.write(`code-dojo:changed: no lintable TypeScript changes ${label}\n`);
  runStep(root, "code-dojo:changed", "file/context ratchet", "node", ["scripts/code-dojo/check-staged-files.mjs", "--all"]);
  runStep(root, "code-dojo:changed", "code size gate", "npm", ["run", "code:size"]);
}

main();
