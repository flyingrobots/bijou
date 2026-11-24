import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const HOOK = resolve(dirname(fileURLToPath(import.meta.url)), '../hooks/pre-push');
const ZERO = '0'.repeat(40);

// Extract the hook's own functions by name so the test runs the real logic
// without executing the hook body (Docker check, gates, npm scripts).
const FUNCTIONS = ['is_dogfood_relevant_path', 'changed_paths_for_push'];
const EXTRACT = FUNCTIONS.map((n) => `awk '/^${n}\\(\\) \\{/,/^\\}/' "$HOOK"`).join('; ');

let repo = '';

function run(script: string, args: string[] = []): string {
  const env = { PATH: process.env.PATH ?? '', HOME: repo, GIT_CONFIG_NOSYSTEM: '1', HOOK };
  const result = spawnSync('bash', ['-c', script, 'bash', ...args], { cwd: repo, env, encoding: 'utf8' });
  expect(result.stderr).toBe('');
  expect(result.status).toBe(0);
  return result.stdout.trim();
}

function git(...args: string[]): string {
  return run(`git -c user.name=t -c user.email=t@example.invalid -c commit.gpgsign=false -c core.hooksPath=/dev/null "$@"`, args);
}

function commit(file: string): string {
  mkdirSync(dirname(join(repo, file)), { recursive: true });
  writeFileSync(join(repo, file), `${file}\n`);
  git('add', file);
  git('commit', '-q', '-m', `touch ${file}`);
  return git('rev-parse', 'HEAD');
}

function changedPaths(local: string, remote: string): string[] {
  const script = `eval "$(${EXTRACT})"; changed_paths_for_push "$1" "$2"`;
  return run(script, [local, remote]).split('\n').filter(Boolean).sort();
}

function relevant(path: string): boolean {
  const script = `eval "$(${EXTRACT})"; is_dogfood_relevant_path "$1" && echo yes || echo no`;
  return run(script, [path]) === 'yes';
}

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'bijou-prepush-'));
  git('init', '-q', '-b', 'main');
});

afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
});

describe('pre-push changed_paths_for_push', () => {
  it('detects paths from every commit of a first publication', () => {
    const base = commit('README.md');
    git('update-ref', 'refs/remotes/origin/main', base);
    git('checkout', '-q', '-b', 'feature');
    commit('examples/docs/first.ts');
    commit('notes/second.txt');
    commit('docs/third.md');
    const head = commit('packages/lib/fourth.ts');

    const paths = changedPaths(head, ZERO);

    expect(paths).toEqual(['docs/third.md', 'examples/docs/first.ts', 'notes/second.txt', 'packages/lib/fourth.ts']);
    expect(paths.some(relevant)).toBe(true);
  });

  it('detects a DOGFOOD path that only an early commit touched', () => {
    const base = commit('README.md');
    git('update-ref', 'refs/remotes/origin/main', base);
    git('checkout', '-q', '-b', 'feature');
    commit('scripts/dogfood-gate.mjs');
    commit('notes/a.txt');
    const head = commit('notes/b.txt');

    expect(changedPaths(head, ZERO).some(relevant)).toBe(true);
  });

  it('reports no DOGFOOD-relevant path for a first publication of unrelated files', () => {
    const base = commit('README.md');
    git('update-ref', 'refs/remotes/origin/main', base);
    git('checkout', '-q', '-b', 'feature');
    commit('notes/a.txt');
    const head = commit('notes/b.txt');

    const paths = changedPaths(head, ZERO);

    expect(paths).toEqual(['notes/a.txt', 'notes/b.txt']);
    expect(paths.some(relevant)).toBe(false);
  });

  it('diffs against the remote object for an existing remote branch', () => {
    const base = commit('README.md');
    git('checkout', '-q', '-b', 'feature');
    const remote = commit('packages/old.ts');
    commit('notes/a.txt');
    const head = commit('notes/b.txt');

    expect(changedPaths(head, remote)).toEqual(['notes/a.txt', 'notes/b.txt']);
    expect(changedPaths(head, base)).toEqual(['notes/a.txt', 'notes/b.txt', 'packages/old.ts']);
  });
});
