import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type { PackageManifest, PrereleaseMetadata, ReleaseCommandIO, ReleaseCommandOutputs, ReleaseMetadata, StableReleaseMetadata, WorkspacePackage } from './release-metadata.part01.js';
export { parseReleaseTag, readCurrentWorkspaceVersion, readWorkspacePackages, validateReleaseVersion } from './release-metadata.part02.js';
export { formatReleaseOutputs, validateWorkspaceVersion, writeGithubOutput } from './release-metadata.part03.js';
export { runReleaseMetadata } from './release-metadata.part04.js';
import { runReleaseMetadata } from './release-metadata.part04.js';

/**
 * This file is the CLI entry point, so the dispatch belongs here.
 *
 * It used to `import './release-metadata.part04.js'` purely for the side effect
 * of that module's own main guard. That guard compares `import.meta.url` against
 * `process.argv[1]`, which can never match when the process was started on
 * *this* file — so `npm run release:preflight` exited 0 having done nothing at
 * all: no lock-step check, no stdout, and no `GITHUB_OUTPUT`.
 *
 * The consequences were not cosmetic. `REL-META-VERSION-LOCKSTEP` is the gate
 * the release process assigns to `release:preflight`, so version-mismatch
 * detection was unenforced — `--version 9.9.9` against an `8.0.0-rc.1`
 * workspace exited 0. And because no output was written, the Release Dry Run's
 * notes job received an empty tag and failed with
 * `gh: Missing tag_name parameter (HTTP 400)`, which is how this was found.
 *
 * A no-op gate is worse than a missing one: it reports success.
 */
if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  process.exitCode = runReleaseMetadata(process.argv.slice(2));
}
