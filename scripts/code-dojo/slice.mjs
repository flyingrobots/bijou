#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { eslintCacheArgs, localEslintCommand } from "./eslint-results.mjs";
import { repoRoot } from "./git.mjs";

function parseArgs(args) {
  const files = [];
  for (const arg of args) {
    if (arg.startsWith("-")) throw new Error(`Unknown code-dojo:slice option: ${arg}`);
    files.push(arg);
  }
  if (files.length === 0) throw new Error("Usage: npm run code-dojo:slice -- <file.ts> [more-files.ts]");
  return files;
}

function runStep(root, label, command, args) {
  const started = Date.now();
  process.stdout.write(`\ncode-dojo:slice: ${label}\n`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  if (result.status !== 0) {
    process.stderr.write(`code-dojo:slice: ${label} failed after ${elapsed}s\n`);
    process.exit(result.status ?? 1);
  }

  process.stdout.write(`code-dojo:slice: ${label} ok (${elapsed}s)\n`);
}

function main() {
  let files;
  try {
    files = parseArgs(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`code-dojo:slice: ${message}\n`);
    process.exit(1);
  }

  const root = repoRoot();
  runStep(root, "focused cached ESLint", localEslintCommand(root), [
    "--max-warnings=0",
    "--no-warn-ignored",
    ...eslintCacheArgs(root),
    ...files,
  ]);
  runStep(root, "file/context ratchet", "node", ["scripts/code-dojo/check-staged-files.mjs", "--all"]);
  runStep(root, "code size gate", "npm", ["run", "code:size"]);
  runStep(root, "test typecheck", "npm", ["run", "typecheck:test"]);
}

main();
