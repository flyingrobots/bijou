#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";

const file = process.argv[2];

if (!file) {
  console.error("Code Dojo: commit message file argument missing.");
  process.exit(1);
}

const message = readFileSync(file, "utf8").trim();
const firstLine = message.split(/\r?\n/u)[0] ?? "";

if (/^(Merge|Revert)\b/u.test(firstLine)) {
  process.exit(0);
}

const conventional = /^(feat|fix|test|refactor|docs|chore|build|ci|perf|style)(\([a-z0-9-]+\))?!?: [a-z0-9].{11,71}$/u;
const garbage = /^(wip|misc|changes|fix|stuff|updates?|work|temp|checkpoint)(?:\s|:|$)/iu;

const failures = [];

if (!conventional.test(firstLine)) {
  failures.push("Use: type(scope): observable change, 12-72 chars after the colon.");
}

if (garbage.test(firstLine)) {
  failures.push("Garbage commit summary detected. Name the system behavior, not your emotional state.");
}

if (message.includes("AI-Authored: true") || message.includes("Agent: ")) {
  const receiptLine = message.split(/\r?\n/u).find((line) => line.startsWith("Graft-Receipt: "));
  if (!receiptLine) {
    failures.push("AI-authored commits must include a 'Graft-Receipt: <path>' trailer.");
  } else {
    const receiptPath = receiptLine.replace("Graft-Receipt: ", "").trim();
    if (!existsSync(receiptPath)) {
      failures.push(`Graft receipt does not exist: ${receiptPath}`);
    }
  }
}

if (failures.length > 0) {
  console.error("\nCode Dojo: commit message failed\n");
  console.error(`Commit summary: ${firstLine || "<empty>"}\n`);
  for (const failure of failures) console.error(`- ${failure}`);
  console.error("\nExamples:");
  console.error("  fix(clock): inject fixed clock into token expiry test");
  console.error("  refactor(user): split repository port from postgres adapter\n");
  process.exit(1);
}
