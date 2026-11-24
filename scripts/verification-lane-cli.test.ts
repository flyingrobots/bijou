import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv } from 'ajv';
import { afterEach, describe, expect, it } from 'vitest';
import { LANE_EVENT_SCHEMA_PATH, runVerificationLane, type LaneIo, type LaneRun } from './verification-lane-cli.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const parsedSchema: unknown = JSON.parse(readFileSync(join(ROOT, LANE_EVENT_SCHEMA_PATH), 'utf8'));
if (parsedSchema == null || typeof parsedSchema !== 'object') throw new Error('the lane event schema is not an object');
const validate = new Ajv({ strict: true }).compile(parsedSchema);
const dirs: string[] = [];

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'bijou-lane-'));
  dirs.push(dir);
  return dir;
}

function git(cwd: string, ...args: string[]): string {
  const result = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.invalid', '-c', 'commit.gpgsign=false', ...args], {
    cwd,
    encoding: 'utf8',
    env: { PATH: process.env.PATH ?? '', HOME: cwd, GIT_CONFIG_NOSYSTEM: '1' },
  });
  expect(result.status, result.stderr).toBe(0);
  return result.stdout.trim();
}

function write(repo: string, file: string, text = `${file}\n`): void {
  mkdirSync(dirname(join(repo, file)), { recursive: true });
  writeFileSync(join(repo, file), text);
}

function repoWithMain(): string {
  const repo = tempDir();
  git(repo, 'init', '-q', '-b', 'main');
  write(repo, 'docs/old.md');
  write(repo, 'tests/a.test.ts');
  git(repo, 'add', '.');
  git(repo, 'commit', '-q', '-m', 'base');
  git(repo, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
  git(repo, 'checkout', '-q', '-b', 'feature');
  return repo;
}

function io(cwd: string, githubOutput: string | null = null): LaneIo {
  return { cwd, readText: (source) => readFileSync(source, 'utf8'), githubOutput };
}

function lines(run: LaneRun): Record<string, unknown>[] {
  return [...run.stdout, ...run.stderr].map((text) => {
    const parsed: unknown = JSON.parse(text);
    expect(validate(parsed), `${text}\n${JSON.stringify(validate.errors)}`).toBe(true);
    if (parsed == null || typeof parsed !== 'object') throw new Error('not an object line');
    return Object.fromEntries(Object.entries(parsed));
  });
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('npm run verify:lane', () => {
  it('classifies a docs and test commit fast against the merge base with origin/main', () => {
    const repo = repoWithMain();
    write(repo, 'docs/CHANGELOG.md');
    write(repo, 'tests/a.test.ts', 'changed\n');
    git(repo, 'add', '.');
    git(repo, 'commit', '-q', '-m', 'docs');
    const run = runVerificationLane([], io(repo));
    const [decision] = lines(run);

    expect(run.code).toBe(0);
    expect(decision).toMatchObject({ kind: 'lane-decision', lane: 'fast', dogfood: true, requiredPolicy: 'bijou.verify.fast.v1' });
    expect(decision?.base).toBe(git(repo, 'rev-parse', 'origin/main'));
  });

  it('escalates a rename and a deletion found by the real git diff', () => {
    const repo = repoWithMain();
    git(repo, 'mv', 'docs/old.md', 'docs/new.md');
    git(repo, 'rm', '-q', 'tests/a.test.ts');
    git(repo, 'commit', '-q', '-m', 'move');
    const [decision] = lines(runVerificationLane(['--base', 'origin/main'], io(repo)));

    expect(decision).toMatchObject({ lane: 'full', requiredPolicy: 'bijou.verify.full.v1' });
    expect(JSON.stringify(decision?.reasons)).toContain('"escalation":"renamed"');
    expect(JSON.stringify(decision?.reasons)).toContain('"escalation":"deleted"');
  });

  it('classifies HEAD equal to its base as an empty change set, full', () => {
    const [decision] = lines(runVerificationLane([], io(repoWithMain())));

    expect(decision).toMatchObject({ lane: 'full', dogfood: true });
  });

  it('exits non-zero with a schema-valid full error line when the diff cannot be computed', () => {
    const repo = tempDir();
    const output = join(repo, 'github-output');
    const run = runVerificationLane(['--base', 'origin/main'], io(repo, output));

    expect(run.code).toBe(1);
    expect(run.stdout).toEqual([]);
    expect(lines(run)).toMatchObject([{ kind: 'error', code: 'git-failed', lane: 'full', dogfood: true }]);
    expect(readFileSync(output, 'utf8')).toBe('lane=full\ndogfood=true\n');
  });

  it.each([[['--paths-from']], [['--wat']], [['--base', 'x', '--paths-from', 'y']]])('rejects bad arguments %j', (args) => {
    const run = runVerificationLane(args, io(ROOT));

    expect(run.code).toBe(1);
    expect(lines(run)).toMatchObject([{ kind: 'error', code: 'bad-arguments', lane: 'full' }]);
  });

  it('reads --paths-from, writes $GITHUB_OUTPUT and prints prose with --human', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'paths.txt'), 'docs/CHANGELOG.md\nscripts/clean.mjs\n');
    const output = join(dir, 'github-output');
    const json = runVerificationLane(['--paths-from', 'paths.txt', '--json'], io(dir, output));
    const human = runVerificationLane(['--paths-from', 'paths.txt', '--human'], io(dir));

    expect(lines(json)).toMatchObject([{ kind: 'lane-decision', lane: 'fast', base: null }]);
    expect(readFileSync(output, 'utf8')).toBe('lane=fast\ndogfood=true\n');
    expect(human.stdout.at(-1)).toBe('lane=fast dogfood=true');
    expect(human.stdout).toContain('  fast  docs-only  docs/CHANGELOG.md (pattern docs/**)');
  });

  it('reports an unreadable path list as an error, never a lane', () => {
    const run = runVerificationLane(['--paths-from', 'missing.txt'], io(tempDir()));

    expect(run.code).toBe(1);
    expect(lines(run)).toMatchObject([{ kind: 'error', code: 'unreadable-paths' }]);
  });

  it('describes itself with --help and --schema as schema-valid lines', () => {
    expect(lines(runVerificationLane(['--help'], io(ROOT)))).toMatchObject([{ kind: 'help', command: 'verify:lane' }]);
    expect(lines(runVerificationLane(['--schema'], io(ROOT)))).toMatchObject([{ kind: 'schema', schema: parsedSchema }]);
  });
});
