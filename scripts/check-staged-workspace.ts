import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runReleaseMetadata } from './release-metadata.js';

/** Validate immutable index blobs without checking out or staging any files. */
function checkStagedWorkspace(): number {
  const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf8', timeout: 10_000,
  }).trim();
  const git = (args: readonly string[]) => execFileSync('git', [...args], {
    cwd: root, encoding: 'utf8', timeout: 10_000, maxBuffer: 8 * 1024 * 1024,
  });
  const snapshot = mkdtempSync(join(tmpdir(), 'bijou-staged-workspace-'));
  try {
    const entries = git(['ls-files', '--stage', '--full-name', '-z']).split('\0');
    for (const entry of entries) {
      if (entry === '') continue;
      const separator = entry.indexOf('\t');
      const path = entry.slice(separator + 1);
      if (path !== 'package-lock.json' && path !== 'package.json' && !path.endsWith('/package.json')) continue;
      const [mode, objectId, stage] = entry.slice(0, separator).split(' ');
      if (separator < 0 || stage !== '0' || !['100644', '100755'].includes(mode ?? '') ||
          objectId === undefined || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(objectId)) {
        throw new Error(`Cannot validate staged metadata entry: ${path}`);
      }
      const destination = resolve(snapshot, path);
      if (!destination.startsWith(`${snapshot}${sep}`)) throw new Error(`Invalid staged metadata path: ${path}`);
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, git(['cat-file', 'blob', objectId]));
    }
    return runReleaseMetadata(['--current-version'], { cwd: snapshot });
  } finally {
    rmSync(snapshot, { recursive: true, force: true });
  }
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    process.exitCode = checkStagedWorkspace();
  } catch (error) {
    console.error(`pre-commit: staged workspace validation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
