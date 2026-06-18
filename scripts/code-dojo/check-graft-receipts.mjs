#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { allWorkspaceFiles, repoRoot, stagedFiles } from "./git.mjs";

const root = repoRoot();
const args = new Set(process.argv.slice(2));
const all = args.has("--all");
const requireReceipt = process.env.GRAFT_REQUIRED === "true";

function isReceipt(file) {
  return file.split(path.sep).join("/").startsWith(".graft/receipts/") && file.endsWith(".json");
}

const files = (all ? allWorkspaceFiles() : stagedFiles()).filter(isReceipt);
const failures = [];

if (requireReceipt && files.length === 0) {
  failures.push("GRAFT_REQUIRED=true but no .graft/receipts/*.json file is present.");
}

for (const file of files) {
  const absolute = path.join(root, file);
  if (!existsSync(absolute)) continue;

  let data;
  try {
    data = JSON.parse(readFileSync(absolute, "utf8"));
  } catch (error) {
    failures.push(`${file} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    continue;
  }

  for (const key of ["schema", "sessionId", "agent", "task", "bytesConsumed", "filesRead", "filesModified", "tripwires"]) {
    if (!(key in data)) failures.push(`${file} missing required key: ${key}`);
  }

  if (data.schema !== "graft.receipt.v1") failures.push(`${file} has unsupported schema: ${String(data.schema)}`);
  if (!Number.isInteger(data.bytesConsumed) || data.bytesConsumed < 0) failures.push(`${file} bytesConsumed must be a non-negative integer.`);
  if (!Array.isArray(data.filesRead)) failures.push(`${file} filesRead must be an array.`);
  if (!Array.isArray(data.filesModified)) failures.push(`${file} filesModified must be an array.`);
  if (!Array.isArray(data.tripwires)) failures.push(`${file} tripwires must be an array.`);
}

if (failures.length > 0) {
  console.error("\nCode Dojo: Graft receipt validation failed\n");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error("");
  process.exit(1);
}
