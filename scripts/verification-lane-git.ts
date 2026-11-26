import { spawnSync } from 'node:child_process';
import type { ChangedPath } from './verification-lane-classify.js';

export const DEFAULT_BASE_REF = 'origin/main';

/** A failure that must stop classification. The command exits non-zero; it never defaults to fast. */
export class LaneInputError extends Error {
  constructor(
    readonly code: 'bad-arguments' | 'git-failed' | 'unparseable-diff' | 'unreadable-paths',
    message: string,
  ) {
    super(message);
  }
}

function git(cwd: string, args: readonly string[]): string {
  const result = spawnSync('git', ['-c', 'core.quotePath=false', ...args], { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (result.error != null) throw new LaneInputError('git-failed', `git ${args.join(' ')}: ${result.error.message}`);
  if (result.status !== 0) {
    throw new LaneInputError('git-failed', `git ${args.join(' ')} exited ${String(result.status)}: ${result.stderr.trim()}`);
  }
  return result.stdout;
}

/** The merge base of `baseRef` and `HEAD`. Classification is always against the merge base (DL-030). */
export function mergeBase(cwd: string, baseRef: string): string {
  return git(cwd, ['merge-base', baseRef, 'HEAD']).trim();
}

/**
 * Parses `git diff --name-status -z` output. A rename or copy contributes both
 * its old and its new path, each with the R or C status.
 */
export function parseNameStatusZ(output: string): ChangedPath[] {
  const tokens = output.split('\0');
  if (tokens.at(-1) === '') tokens.pop();
  const changes: ChangedPath[] = [];
  let index = 0;
  while (index < tokens.length) {
    const status = tokens[index] ?? '';
    if (!/^[A-Z][0-9]{0,3}$/.test(status)) throw new LaneInputError('unparseable-diff', `unexpected diff status token: ${JSON.stringify(status)}`);
    const width = status.startsWith('R') || status.startsWith('C') ? 2 : 1;
    const paths = tokens.slice(index + 1, index + 1 + width);
    if (paths.length !== width) throw new LaneInputError('unparseable-diff', `diff entry ${status} is missing a path`);
    for (const path of paths) changes.push({ path, status });
    index += 1 + width;
  }
  return changes;
}

/** Every path changed between the merge base and `HEAD`, with rename detection on. */
export function changedPathsSince(cwd: string, base: string): ChangedPath[] {
  const output = git(cwd, ['diff', '--name-status', '-z', '-M', '--no-ext-diff', '--no-textconv', '--no-color', base, 'HEAD']);
  return parseNameStatusZ(output);
}

/**
 * Parses a `--paths-from` list: one entry per line, either a bare path or a
 * `git diff --name-status` line (`M\tpath`, `R100\told\tnew`). Bare paths carry
 * no status, so a deletion or rename listed bare is classified by its rule.
 */
export function parsePathList(text: string): ChangedPath[] {
  const changes: ChangedPath[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (line === '') continue;
    const fields = line.split('\t');
    if (fields.length === 1) {
      changes.push({ path: line, status: null });
      continue;
    }
    const [status = '', ...paths] = fields;
    if (!/^[A-Z][0-9]{0,3}$/.test(status) || paths.length === 0 || paths.length > 2) {
      throw new LaneInputError('unparseable-diff', `unparseable path list line: ${JSON.stringify(line)}`);
    }
    for (const path of paths) changes.push({ path, status });
  }
  return changes;
}
