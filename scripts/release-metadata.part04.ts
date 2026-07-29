import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ReleaseCommandIO, ReleaseCommandOutputs } from './release-metadata.part01.js';
import { parseReleaseTag, readCurrentWorkspaceVersion, validateReleaseVersion } from './release-metadata.part02.js';
import { formatReleaseOutputs, hasFlag, parseOption, printPackageSummary, validateWorkspaceVersion, writeGithubOutput } from './release-metadata.part03.js';

export function runReleaseMetadata(argv: readonly string[], io: ReleaseCommandIO = {}): number {
  const root = resolve(io.cwd ?? process.cwd());
  const stdout = io.stdout ?? ((text: string) => process.stdout.write(text));
  const stderr = io.stderr ?? ((text: string) => process.stderr.write(text));

  try {
    const tag = parseOption(argv, '--tag');
    const explicitVersion = parseOption(argv, '--version');
    const notesTag = parseOption(argv, '--notes-tag');
    const notesTagRunId = parseOption(argv, '--notes-tag-run-id');
    const githubOutput = parseOption(argv, '--github-output');
    const useCurrentVersion = hasFlag(argv, '--current-version');

    const versionSources = [tag, explicitVersion, useCurrentVersion ? '__current__' : undefined].filter(Boolean);
    if (versionSources.length !== 1) {
      throw new Error('Specify exactly one of --tag, --version, or --current-version');
    }

    if (notesTag && notesTagRunId) {
      throw new Error('Use either --notes-tag or --notes-tag-run-id, not both');
    }

    let expectedVersion: string;
    let outputs: ReleaseCommandOutputs;
    let packageSummaryLabel: string;

    if (tag) {
      const metadata = parseReleaseTag(tag);
      expectedVersion = metadata.tagVersion;
      outputs = {
        tag: metadata.tag,
        tag_version: metadata.tagVersion,
        is_prerelease: String(metadata.isPrerelease),
        npm_dist_tag: metadata.npmDistTag,
      };
      packageSummaryLabel = 'tag';
    } else {
      const selectedVersion = useCurrentVersion ? readCurrentWorkspaceVersion(root) : explicitVersion;
      if (selectedVersion == null) throw new Error('Missing release version');
      expectedVersion = validateReleaseVersion(selectedVersion);
      const resolvedNotesTag = notesTagRunId ? `dry-run-v${expectedVersion}-${notesTagRunId}` : notesTag;
      outputs = {
        version: expectedVersion,
        ...(resolvedNotesTag ? { notes_tag: resolvedNotesTag } : {}),
      };
      packageSummaryLabel = 'release';
    }

    const validation = validateWorkspaceVersion(root, expectedVersion);
    printPackageSummary(validation.packages, expectedVersion, packageSummaryLabel, stdout);

    if (validation.errors.length > 0) {
      for (const error of validation.errors) {
        stderr(`::error::${error}\n`);
      }
      stderr(`::error::Workspace version mismatch detected. Run: npm run version ${expectedVersion}\n`);
      return 1;
    }

    if (githubOutput) {
      writeGithubOutput(githubOutput, outputs);
    } else {
      stdout(formatReleaseOutputs(outputs));
    }

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr(`${message}\n`);
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = runReleaseMetadata(process.argv.slice(2));
}
