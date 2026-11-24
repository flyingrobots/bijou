import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export const FIXTURE_CEILING = 12;

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

/** Writes a repo-shaped directory whose three baselines hold real debt. */
export function createDebtFixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'bijou-debt-report-'));
  const baselines = join(root, 'scripts/code-dojo/baselines');
  writeJson(join(root, 'package.json'), {
    scripts: { 'code-dojo:debt': `tsx scripts/code-dojo-debt.ts --max ${String(FIXTURE_CEILING)}` },
  });
  writeJson(join(baselines, 'file-context.json'), {
    schema: 'code-dojo.file-context-baseline.v1',
    files: [{ path: 'a.ts' }, { path: 'b.ts' }],
  });
  writeJson(join(baselines, 'mock-ban.json'), {
    schema: 'code-dojo.mock-ban-baseline.v1',
    violations: [{ path: 'c.test.ts' }],
  });
  writeJson(join(baselines, 'eslint.json'), {
    schema: 'code-dojo.eslint-baseline.v1',
    total: 5,
    errors: 3,
    warnings: 2,
    rules: [
      { ruleId: 'no-b', count: 2 },
      { ruleId: 'no-a', count: 2 },
      { ruleId: 'no-c', count: 1 },
    ],
  });
  return root;
}

export const FIXTURE_LIVE = {
  schema: 'code-dojo.eslint-live.v1',
  eslintViolations: 4,
  eslintFiles: [
    { path: 'z.ts', count: 1 },
    { path: 'a.ts', count: 1 },
    { path: 'm.ts', count: 2 },
  ],
} as const;
