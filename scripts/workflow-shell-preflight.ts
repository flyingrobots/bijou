#!/usr/bin/env npx tsx

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { main } from './workflow-shell-preflight.part04.js';
export type { WorkflowShellStep } from './workflow-shell-preflight.part01.js';
export {
  listWorkflowFiles,
  sanitizeGithubExpressions,
  shouldValidateShell,
} from './workflow-shell-preflight.part01.js';
export { parseWorkflowRunSteps } from './workflow-shell-preflight.part02.js';
export { validateShellScript } from './workflow-shell-preflight.part03.js';
export { runWorkflowShellPreflight } from './workflow-shell-preflight.part04.js';

if (
  process.argv[1] != null &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  main();
}
