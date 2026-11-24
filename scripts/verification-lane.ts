#!/usr/bin/env tsx
/**
 * `npm run verify:lane`: classify changed paths into the fast or full
 * verification lane (DL-030, flyingrobots/bijou#610). The classifier is a pure
 * function; this entry only reads the diff and prints JSON Lines.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runVerificationLane } from './verification-lane-cli.js';

export {
  classifyChanges,
  classifyPath,
  classifyVerificationLane,
  DOGFOOD_PATTERNS,
  isDogfoodRelevant,
  requiredPolicy,
  type ChangedPath,
  type Escalation,
  type LaneDecision,
  type PathReason,
  type VerificationPolicy,
} from './verification-lane-classify.js';
export { FAST_JUSTIFICATIONS, LANE_RULES, type Lane, type LaneRule, type ReasonId } from './verification-lane-rules.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const result = runVerificationLane(process.argv.slice(2), {
    cwd: ROOT,
    readText: (source) => readFileSync(source === '-' ? 0 : source, 'utf8'),
    githubOutput: process.env.GITHUB_OUTPUT ?? null,
  });
  for (const text of result.stdout) process.stdout.write(`${text}\n`);
  for (const text of result.stderr) process.stderr.write(`${text}\n`);
  process.exitCode = result.code;
}
