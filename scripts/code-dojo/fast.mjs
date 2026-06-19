#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { eslintCacheArgs, localEslintCommand } from "./eslint-results.mjs";
import { repoRoot } from "./git.mjs";

function parseFiles(args) {
  const files = [];
  for (const arg of args) {
    if (arg.startsWith("-")) throw new Error(`Unknown code-dojo:fast option: ${arg}`);
    files.push(arg);
  }
  if (files.length === 0) throw new Error("Usage: npm run code-dojo:fast -- <file.ts> [more-files.ts]");
  return files;
}

export function runStep(root, commandName, label, command, args) {
  const started = Date.now();
  process.stdout.write(`\n${commandName}: ${label}\n`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  if (result.status !== 0) {
    process.stderr.write(`${commandName}: ${label} failed after ${elapsed}s\n`);
    process.exit(result.status ?? 1);
  }

  process.stdout.write(`${commandName}: ${label} ok (${elapsed}s)\n`);
}

export function runFastLane(root, files, commandName = "code-dojo:fast") {
  runStep(root, commandName, "focused cached ESLint", localEslintCommand(root), [
    "--max-warnings=0",
    "--no-warn-ignored",
    ...eslintCacheArgs(root),
    ...files,
  ]);
  runStep(root, commandName, "file/context ratchet", "node", ["scripts/code-dojo/check-staged-files.mjs", "--all"]);
  runStep(root, commandName, "code size gate", "npm", ["run", "code:size"]);
}

function main() {
  let files;
  try {
    files = parseFiles(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`code-dojo:fast: ${message}\n`);
    process.exit(1);
  }

  runFastLane(repoRoot(), files);
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
