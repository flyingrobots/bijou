#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { allWorkspaceFiles, repoRoot, stagedFiles, stagedContent } from "./git.mjs";

const root = repoRoot();
const args = new Set(process.argv.slice(2));
const all = args.has("--all");
const allowMarker = "code-dojo: allow-mock";
const baselinePath = path.join(root, "scripts/code-dojo/baselines/mock-ban.json");

const testFilePattern = /(?:^|\/)(?:test|tests)\/.*\.(?:test|spec)?\.?[cm]?tsx?$|\.(?:test|spec)\.[cm]?tsx?$/u;
const forbidden = [
  { pattern: /\bjest\.mock\s*\(/u, message: "jest.mock is banned; use an in-memory fake adapter" },
  { pattern: /\bvi\.mock\s*\(/u, message: "vi.mock is banned; use an in-memory fake adapter" },
  { pattern: /\bsinon\.mock\s*\(/u, message: "sinon.mock is banned; use an in-memory fake adapter" },
  { pattern: /\bspyOn\s*\(/u, message: "spies usually assert choreography; prefer observable behavior" },
  { pattern: /\.mockResolvedValue\b/u, message: "mockResolvedValue is banned; use a fake with explicit state" },
  { pattern: /\.mockRejectedValue\b/u, message: "mockRejectedValue is banned; use a fake with explicit state" },
  { pattern: /\.mockReturnValue\b/u, message: "mockReturnValue is banned; use a fake with explicit state" }
];

function loadBaseline() {
  if (!existsSync(baselinePath)) return new Map();

  const parsed = JSON.parse(readFileSync(baselinePath, "utf8"));
  if (parsed.schema !== "code-dojo.mock-ban-baseline.v1" || !Array.isArray(parsed.violations)) {
    throw new Error(`${baselinePath} is not a code-dojo.mock-ban-baseline.v1 file`);
  }

  const baseline = new Map();
  for (const violation of parsed.violations) {
    const fileBaseline = baseline.get(violation.file) ?? new Map();
    const key = `${violation.message}\0${violation.source}`;
    fileBaseline.set(key, (fileBaseline.get(key) ?? 0) + 1);
    baseline.set(violation.file, fileBaseline);
  }
  return baseline;
}

function isTestFile(file) {
  return testFilePattern.test(file.split(path.sep).join("/"));
}

function contentOf(file) {
  if (all) {
    const absolute = path.join(root, file);
    return existsSync(absolute) ? readFileSync(absolute, "utf8") : "";
  }

  return stagedContent(file);
}

const files = (all ? allWorkspaceFiles() : stagedFiles()).filter(isTestFile);
const baseline = loadBaseline();
const failures = [];
let ratcheted = 0;

for (const file of files) {
  const content = contentOf(file);
  if (content.includes(allowMarker)) continue;

  const lines = content.split(/\r?\n/u);
  for (const [index, line] of lines.entries()) {
    for (const rule of forbidden) {
      if (rule.pattern.test(line)) {
        const source = line.trim();
        const fileBaseline = baseline.get(file);
        const key = `${rule.message}\0${source}`;
        const remaining = fileBaseline?.get(key) ?? 0;
        if (remaining > 0) {
          fileBaseline.set(key, remaining - 1);
          ratcheted += 1;
          continue;
        }
        failures.push(`${file}:${index + 1} — ${rule.message}: ${source}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error("\nCode Dojo: mock ban failed\n");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(`\nUse in-memory fakes. For rare process-boundary exceptions, add '${allowMarker}: <approved reason>'.\n`);
  process.exit(1);
}

console.log(`Code Dojo: mock ban ok (${ratcheted} baselined violations held or reduced)`);
