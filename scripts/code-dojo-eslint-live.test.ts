import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Ajv } from 'ajv';
import { afterEach, describe, expect, it } from 'vitest';
import { runEslintJson, summarizeEslintResults } from './code-dojo/eslint-results.mjs';
import { loadCodeDojoDebtReport } from './code-dojo-debt-report.js';
import { parseCodeDojoLiveInput } from './code-dojo-debt-report-live.js';
import { createDebtFixtureRoot } from './code-dojo-debt-report-fixture.js';
import { buildEslintLive, runCodeDojoEslintLive } from './code-dojo-eslint-live.js';

const REAL_ROOT = new URL('..', import.meta.url).pathname;
const SCHEMA_DIR = new URL('../schemas/', import.meta.url);
const roots: string[] = [];
const ajv = new Ajv({ strict: true });

function schema(name: string): object {
  const parsed: unknown = JSON.parse(readFileSync(new URL(name, SCHEMA_DIR), 'utf8'));
  if (parsed == null || typeof parsed !== 'object') throw new Error(`${name} is not a schema object`);
  return parsed;
}

const validateLive = ajv.compile(schema('code-dojo.eslint-live.v1.schema.json'));
const validateEvent = ajv.compile(schema('code-dojo.eslint-live-event.v1.schema.json'));
const validateReport = ajv.compile(schema('code-dojo.debt-report.v1.schema.json'));

/** A fixture root holding real ESLint debt: 2 errors and 1 warning over 2 files. */
function debtRoot(): string {
  const root = createDebtFixtureRoot();
  roots.push(root);
  writeFileSync(
    join(root, 'eslint.config.mjs'),
    "export default [{ files: ['**/*.js'], rules: { 'no-var': 'error', eqeqeq: 'warn' } }];\n",
  );
  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(join(root, 'src/a.js'), 'var x = 1;\nvar y = 2;\n');
  writeFileSync(join(root, 'src/b.js'), 'export const z = 1 == 1;\n');
  return root;
}

function lines(output: readonly string[]): unknown[] {
  return output.map((entry): unknown => JSON.parse(entry));
}

function field(value: unknown, key: string): unknown {
  return value != null && typeof value === 'object' ? Object.entries(value).find(([k]) => k === key)?.[1] : undefined;
}

describe('Code Dojo live ESLint measurement', () => {
  afterEach(() => {
    for (const root of roots.splice(0)) {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it('ranks the top ten files and matches the ratchet total on synthetic results', () => {
    const results = Array.from({ length: 12 }, (_, index) => ({
      filePath: `/repo/src/f${String(index).padStart(2, '0')}.ts`,
      errorCount: index,
      warningCount: 0,
      messages: Array.from({ length: index }, () => ({ ruleId: 'no-var' })),
    }));
    const live = buildEslintLive(results, '/repo');

    expect(live.eslintViolations).toBe(summarizeEslintResults(results).total);
    expect(live.eslintFiles).toHaveLength(10);
    expect(live.eslintFiles?.[0]).toEqual({ path: 'src/f11.ts', count: 11 });
    expect(validateLive(live), JSON.stringify(validateLive.errors)).toBe(true);
  });

  it('equals the ratchet totals on a real ESLint run over a fixture with debt', () => {
    const root = debtRoot();
    const results = runEslintJson(root, ['**/*.js']);
    const live = buildEslintLive(results, root);

    expect(live.eslintViolations).toBe(summarizeEslintResults(results).total);
    expect(live.eslintViolations).toBe(3);
    expect(live.eslintFiles).toEqual([
      { path: 'src/a.js', count: 2 },
      { path: 'src/b.js', count: 1 },
    ]);
  });

  it('reports stored 5, live 3, slack 2 and feeds code-dojo:report', () => {
    const root = debtRoot();
    const out = join(root, 'live.json');
    const result = runCodeDojoEslintLive(['--out', out, '--target', '**/*.js'], root);
    const events = lines(result.stdout);
    const written: unknown = JSON.parse(readFileSync(out, 'utf8'));
    const report = loadCodeDojoDebtReport(root, parseCodeDojoLiveInput(written));

    expect(result.code).toBe(0);
    expect(result.stderr).toEqual([]);
    for (const event of events) expect(validateEvent(event), JSON.stringify(validateEvent.errors)).toBe(true);
    const done = events[events.length - 1];
    expect(field(done, 'kind')).toBe('live-written');
    expect(field(done, 'stored')).toBe(5);
    expect(field(done, 'live')).toBe(3);
    expect(field(done, 'slack')).toBe(2);
    expect(field(done, 'nextCeiling')).toBe(3);
    expect(validateLive(written), JSON.stringify(validateLive.errors)).toBe(true);
    expect(report.live?.eslintViolations).toBe(3);
    expect(validateReport(report), JSON.stringify(validateReport.errors)).toBe(true);
  });

  it('reports negative slack when live exceeds the stored ceiling', () => {
    const root = debtRoot();
    writeFileSync(join(root, 'src/c.js'), 'var a = 1;\nvar b = 2;\nvar c = 3;\n');
    const result = runCodeDojoEslintLive(['--out', join(root, 'live.json'), '--target', '**/*.js'], root);
    const done = lines(result.stdout).pop();

    expect(field(done, 'live')).toBe(6);
    expect(field(done, 'slack')).toBe(-1);
    expect(field(done, 'nextCeiling')).toBe(5);
  });

  it('matches the ratchet total on the real tree and writes a schema-valid file', () => {
    const root = createDebtFixtureRoot();
    roots.push(root);
    const out = join(root, 'live-real.json');
    const real = runCodeDojoEslintLive(['--out', out], REAL_ROOT);
    const done = lines(real.stdout).pop();
    const ratchet = summarizeEslintResults(runEslintJson(REAL_ROOT)).total;

    expect(real.code).toBe(0);
    expect(field(done, 'live')).toBe(ratchet);
    expect(field(done, 'stored')).toBe(0);
    expect(validateEvent(done), JSON.stringify(validateEvent.errors)).toBe(true);
  }, 600_000);

  it('turns bad arguments into a schema-valid error line and --human into prose', () => {
    const root = debtRoot();
    const bad = runCodeDojoEslintLive(['--nope'], root);
    const help = runCodeDojoEslintLive(['--help'], root);
    const human = runCodeDojoEslintLive(['--human', '--out', join(root, 'h.json'), '--target', '**/*.js'], root);

    expect(bad.code).toBe(1);
    expect(bad.stdout).toEqual([]);
    for (const event of lines(bad.stderr)) expect(validateEvent(event), JSON.stringify(validateEvent.errors)).toBe(true);
    expect(field(lines(bad.stderr)[0], 'code')).toBe('bad-arguments');
    for (const event of lines(help.stdout)) expect(validateEvent(event), JSON.stringify(validateEvent.errors)).toBe(true);
    expect(human.stdout.join('\n')).toContain('slack');
    expect(() => JSON.parse(human.stdout.join('\n'))).toThrow();
  });
});
