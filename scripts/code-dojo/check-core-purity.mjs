#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { allWorkspaceFiles, repoRoot, stagedFiles, stagedContent } from "./git.mjs";

const root = repoRoot();
const args = new Set(process.argv.slice(2));
const all = args.has("--all");
const allowMarker = "code-dojo: allow-core-impurity";

const corePrefixes = ["src/core/", "src/domain/"];
const extensions = new Set([".ts", ".tsx", ".mts", ".cts"]);

const forbidden = [
  { pattern: /from\s+["'](?:node:)?fs(?:\/promises)?["']/u, message: "filesystem import belongs in an adapter" },
  { pattern: /from\s+["'](?:node:)?path["']/u, message: "path semantics belong in an adapter" },
  { pattern: /from\s+["'](?:node:)?crypto["']/u, message: "crypto/random/uuid belongs behind a port" },
  { pattern: /from\s+["'](?:node:)?https?["']/u, message: "network access belongs behind a port" },
  { pattern: /from\s+["'](?:node:)?os["']/u, message: "host OS access belongs in an adapter" },
  { pattern: /from\s+["'](?:node:)?process["']/u, message: "process state belongs in an adapter" },
  { pattern: /\bprocess\.env\b/u, message: "environment variables belong in config adapters" },
  { pattern: /\bDate\.now\s*\(/u, message: "time must be injected through ClockPort" },
  { pattern: /\bnew\s+Date\s*\(/u, message: "time construction must be injected through ClockPort" },
  { pattern: /\bMath\.random\s*\(/u, message: "randomness must be injected through RandomPort" },
  { pattern: /\brandomUUID\s*\(/u, message: "UUID generation must be injected through UuidPort" },
  { pattern: /\bcrypto\.randomUUID\s*\(/u, message: "UUID generation must be injected through UuidPort" },
  { pattern: /\bfetch\s*\(/u, message: "network calls belong in an adapter" },
  { pattern: /\blocalStorage\b/u, message: "browser storage belongs in an adapter" },
  { pattern: /\bsessionStorage\b/u, message: "browser storage belongs in an adapter" }
];

function isCoreFile(file) {
  const normalized = file.split(path.sep).join("/");
  return corePrefixes.some((prefix) => normalized.startsWith(prefix)) && extensions.has(path.extname(normalized)) && !normalized.endsWith(".d.ts");
}

function contentOf(file) {
  if (all) {
    const absolute = path.join(root, file);
    return existsSync(absolute) ? readFileSync(absolute, "utf8") : "";
  }

  return stagedContent(file);
}

const files = (all ? allWorkspaceFiles() : stagedFiles()).filter(isCoreFile);
const failures = [];

for (const file of files) {
  const content = contentOf(file);
  if (content.includes(allowMarker)) continue;

  const lines = content.split(/\r?\n/u);
  for (const [index, line] of lines.entries()) {
    for (const rule of forbidden) {
      if (rule.pattern.test(line)) {
        failures.push(`${file}:${index + 1} — ${rule.message}: ${line.trim()}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error("\nCode Dojo: core purity failed\n");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(`\nUse ports/adapters, or add '${allowMarker}: <approved reason>' only for documented exceptions.\n`);
  process.exit(1);
}
