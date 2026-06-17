#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { allWorkspaceFiles, repoRoot, stagedFiles, stagedContent } from "./git.mjs";

const root = repoRoot();
const args = new Set(process.argv.slice(2));
const all = args.has("--all");
const maxLines = Number(process.env.CODE_DOJO_MAX_LINES ?? 150);
const maxBytes = Number(process.env.CODE_DOJO_MAX_BYTES ?? 12_000);
const baselinePath = path.join(root, "scripts/code-dojo/baselines/file-context.json");

const sourceExtensions = new Set([".ts", ".tsx", ".mts", ".cts"]);
const exemptPathParts = new Set(["node_modules", "dist", "coverage", "vendor", "generated"]);
const allowLargeMarker = "code-dojo: allow-large-file";

function loadBaseline() {
  if (!existsSync(baselinePath)) return new Map();

  const parsed = JSON.parse(readFileSync(baselinePath, "utf8"));
  if (parsed.schema !== "code-dojo.file-context-baseline.v1" || !Array.isArray(parsed.files)) {
    throw new Error(`${baselinePath} is not a code-dojo.file-context-baseline.v1 file`);
  }

  return new Map(parsed.files.map((entry) => [entry.path, entry]));
}

function isSourceFile(file) {
  const normalized = file.split(path.sep).join("/");
  if ([...exemptPathParts].some((part) => normalized.includes(`/${part}/`) || normalized.startsWith(`${part}/`))) {
    return false;
  }

  if (normalized.endsWith(".d.ts")) {
    return false;
  }

  return sourceExtensions.has(path.extname(normalized));
}

function contentOf(file) {
  if (all) {
    const absolute = path.join(root, file);
    return existsSync(absolute) ? readFileSync(absolute, "utf8") : "";
  }

  return stagedContent(file);
}

const files = (all ? allWorkspaceFiles() : stagedFiles()).filter(isSourceFile);
const baseline = loadBaseline();
const failures = [];
let ratcheted = 0;

for (const file of files) {
  const content = contentOf(file);
  if (content.length === 0) continue;

  const lines = content.split(/\r?\n/u).length;
  const bytes = Buffer.byteLength(content, "utf8");
  const firstTwentyLines = content.split(/\r?\n/u).slice(0, 20).join("\n");
  const explicitlyAllowed = firstTwentyLines.includes(allowLargeMarker);
  const baselineEntry = baseline.get(file);

  if (explicitlyAllowed) continue;
  if (lines <= maxLines && bytes <= maxBytes) continue;

  if (baselineEntry == null) {
    failures.push(`${file} is ${lines} lines / ${bytes} bytes. Split it or add a Code Dojo baseline entry.`);
    continue;
  }

  ratcheted += 1;
  if (lines > baselineEntry.lines || bytes > baselineEntry.bytes) {
    failures.push(`${file} is ${lines} lines / ${bytes} bytes; Code Dojo baseline is ${baselineEntry.lines} lines / ${baselineEntry.bytes} bytes.`);
  }
}

if (failures.length > 0) {
  console.error("\nCode Dojo: file/context threshold failed\n");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error("\nSensei says: Large files are where agent context goes to become soup.\n");
  process.exit(1);
}

console.log(`Code Dojo: file/context threshold ok (${ratcheted} baselined files over ${maxLines} lines or ${maxBytes} bytes)`);
