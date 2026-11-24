import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { classifyVerificationLane, isDogfoodRelevant, LANE_RULES } from './verification-lane.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

function trackedPaths(): string[] {
  const result = spawnSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  expect(result.status, result.stderr).toBe(0);
  const paths = result.stdout.split('\0').filter((path) => path !== '');
  expect(paths.length).toBeGreaterThan(1000);
  return paths;
}

/** The shell function body, cut from its file by its exact header and closing brace. */
function shellFunction(file: string, name: string): string {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const found = new RegExp(`^( *)${name}\\(\\) \\{\\n[\\s\\S]*?\\n\\1\\}$`, 'm').exec(source);
  if (found == null) throw new Error(`${name} not found in ${file}`);
  const indent = found[1] ?? '';
  return found[0].split('\n').map((text) => (text.startsWith(indent) ? text.slice(indent.length) : text)).join('\n');
}

/** Runs the real shell `case` function over every path in one bash process. */
function shellVerdicts(file: string, name: string, paths: readonly string[]): boolean[] {
  const script = `${shellFunction(file, name)}\nwhile IFS= read -r p; do if ${name} "$p"; then echo 1; else echo 0; fi; done`;
  const result = spawnSync('bash', ['-c', script], { input: `${paths.join('\n')}\n`, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  expect(result.stderr).toBe('');
  expect(result.status).toBe(0);
  return result.stdout.trim().split('\n').map((verdict) => verdict === '1');
}

const SHELL_COPIES = [
  ['scripts/hooks/pre-push', 'is_dogfood_relevant_path'],
  ['.github/workflows/ci.yml', 'is_dogfood_relevant'],
] as const;

describe('DOGFOOD relevance parity with the shell copies', () => {
  it.each(SHELL_COPIES)('matches %s (%s) for every tracked path and for edge paths', (file, name) => {
    const paths = [
      ...trackedPaths(),
      'docs',
      'docs/new/deep/file.md',
      'packages/new/src/x.ts',
      'tests/cycles/xdogfoody/a.ts',
      'scripts/dogfood-',
      '.github/workflows/sub/x.yml',
      'notes/a.txt',
    ];
    expect(paths.every((path) => !path.includes('\n'))).toBe(true);
    const shell = shellVerdicts(file, name, paths);

    expect(shell).toHaveLength(paths.length);
    const mismatches = paths.filter((path, index) => shell[index] !== isDogfoodRelevant(path));
    expect(mismatches).toEqual([]);
  });
});

describe('verification lane over the real tracked file list', () => {
  it('classifies every tracked file, each by a listed pattern or as unknown', () => {
    const paths = trackedPaths();
    const patterns = new Set(LANE_RULES.map((rule) => rule.pattern));
    const lanes = { fast: 0, full: 0 };
    const reasons = new Map<string, number>();
    for (const path of paths) {
      const decision = classifyVerificationLane([path]);
      const [entry] = decision.reasons;
      if (entry === undefined) throw new Error(`no reason for ${path}`);
      lanes[decision.lane] += 1;
      reasons.set(entry.reason, (reasons.get(entry.reason) ?? 0) + 1);

      expect(entry.escalation, path).toBeNull();
      expect(entry.pattern === '<no rule>' || patterns.has(entry.pattern), path).toBe(true);
    }

    expect(lanes.fast + lanes.full).toBe(paths.length);
    expect(lanes.fast).toBeGreaterThan(0);
    expect(lanes.full).toBeGreaterThan(0);
    expect(reasons.get('docs-only') ?? 0).toBeGreaterThan(0);
    expect(reasons.get('test-only') ?? 0).toBeGreaterThan(0);
    expect(classifyVerificationLane(paths).lane).toBe('full');
  });
});
