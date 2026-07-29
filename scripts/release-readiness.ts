#!/usr/bin/env tsx

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { main } from './release-readiness.part03.js';
export { buildMilestoneTrackerItemCommands } from './release-readiness-tracker.js';
export type {
  ReleaseReadinessTrackerItem,
  ReleaseReadinessTrackerItemCommand,
  ReleaseReadinessTrackerItemKind,
  ReleaseReadinessTrackerLabel,
} from './release-readiness-tracker.js';
export type {
  ReleaseReadinessStep,
  ReleaseReadinessDocsSnapshot,
  ReleaseReadinessCheckStatus,
  ReleaseReadinessReportCheck,
  ReleaseReadinessReport,
  ReleaseReadinessIO,
} from './release-readiness.part01.js';
export { buildReleaseReadinessPlan } from './release-readiness.part01.js';
export {
  buildReleaseReadinessReport,
  formatReleaseReadinessReport,
} from './release-readiness.part02.js';
export {
  runReleaseReadiness,
  parseReleaseReadinessArgs,
} from './release-readiness.part03.js';

if (
  process.argv[1] != null &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  main();
}
