#!/usr/bin/env node
import { chmodSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const hooksDir = path.join(root, ".githooks");

if (!existsSync(hooksDir)) {
  console.error("Code Dojo: .githooks directory not found.");
  process.exit(1);
}

execFileSync("git", ["config", "core.hooksPath", ".githooks"], { cwd: root, stdio: "inherit" });

for (const file of readdirSync(hooksDir)) {
  chmodSync(path.join(hooksDir, file), 0o755);
}

console.log("Code Dojo: Git hooks installed via core.hooksPath=.githooks");
