import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Ajv } from 'ajv';
import { afterEach, describe, expect, it } from 'vitest';
import { loadCodeDojoDebtReport } from './code-dojo-debt-report.js';
import { runCodeDojoDebtReport } from './code-dojo-debt-report-cli.js';
import { FIXTURE_LIVE, createDebtFixtureRoot } from './code-dojo-debt-report-fixture.js';

const SCHEMA_DIR = new URL('../schemas/', import.meta.url);
const roots: string[] = [];
const ajv = new Ajv({ strict: true });

function schema(name: string): object {
  const parsed: unknown = JSON.parse(readFileSync(new URL(name, SCHEMA_DIR), 'utf8'));
  if (parsed == null || typeof parsed !== 'object') throw new Error(`${name} is not a schema object`);
  return parsed;
}

const validateReport = ajv.compile(schema('code-dojo.debt-report.v1.schema.json'));
const validateEvent = ajv.compile(schema('code-dojo.debt-report-event.v1.schema.json'));

function fixtureRoot(): string {
  const root = createDebtFixtureRoot();
  roots.push(root);
  return root;
}

function parseLines(lines: readonly string[]): unknown[] {
  return lines.map((line): unknown => JSON.parse(line));
}

describe('Code Dojo debt report command', () => {
  afterEach(() => {
    for (const root of roots.splice(0)) {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it('writes the committed report path and emits one schema-valid JSON line', () => {
    const root = fixtureRoot();
    const result = runCodeDojoDebtReport([], root);
    const written: unknown = JSON.parse(readFileSync(join(root, 'docs/code-dojo/debt-report.json'), 'utf8'));

    expect(result.code).toBe(0);
    expect(result.stderr).toEqual([]);
    expect(result.stdout).toHaveLength(1);
    for (const line of parseLines(result.stdout)) expect(validateEvent(line), JSON.stringify(validateEvent.errors)).toBe(true);
    expect(validateReport(written), JSON.stringify(validateReport.errors)).toBe(true);
    expect(written).toEqual(loadCodeDojoDebtReport(root, null));
  });

  it('validates the real-tree report and a debt fixture report against the schema', () => {
    const real = loadCodeDojoDebtReport(new URL('..', import.meta.url).pathname, null);
    const debt = loadCodeDojoDebtReport(fixtureRoot(), null);

    expect(validateReport(real), JSON.stringify(validateReport.errors)).toBe(true);
    expect(validateReport(debt), JSON.stringify(validateReport.errors)).toBe(true);
  });

  it('--check passes on a current file and fails with a schema-valid error line when stale', () => {
    const root = fixtureRoot();
    runCodeDojoDebtReport([], root);
    const current = runCodeDojoDebtReport(['--check'], root);
    writeFileSync(join(root, 'docs/code-dojo/debt-report.json'), '{}\n');
    const stale = runCodeDojoDebtReport(['--check'], root);

    expect(current.code).toBe(0);
    expect(stale.code).toBe(1);
    expect(stale.stdout).toEqual([]);
    for (const line of [...parseLines(current.stdout), ...parseLines(stale.stderr)]) {
      expect(validateEvent(line), JSON.stringify(validateEvent.errors)).toBe(true);
    }
    expect(parseLines(stale.stderr)).toMatchObject([{ kind: 'error', code: 'report-stale' }]);
  });

  it('--live-input with --out fills live, and rejects the default committed path', () => {
    const root = fixtureRoot();
    const input = join(root, 'live.json');
    const out = join(root, 'out/report.json');
    writeFileSync(input, JSON.stringify(FIXTURE_LIVE));
    mkdirSync(join(root, 'out'));

    const ok = runCodeDojoDebtReport(['--live-input', input, '--out', out], root);
    const rejected = runCodeDojoDebtReport(['--live-input', input], root);

    expect(ok.code).toBe(0);
    expect(JSON.parse(readFileSync(out, 'utf8'))).toMatchObject({ live: { eslintViolations: 4 } });
    expect(rejected.code).toBe(1);
    expect(parseLines(rejected.stderr)).toMatchObject([{ kind: 'error', code: 'live-needs-out' }]);
    for (const line of parseLines(rejected.stderr)) expect(validateEvent(line)).toBe(true);
  });

  it('converts a thrown failure into a schema-valid error line', () => {
    const result = runCodeDojoDebtReport(['--live-input', join(fixtureRoot(), 'missing.json'), '--out', 'x.json'], fixtureRoot());

    expect(result.code).toBe(1);
    expect(parseLines(result.stderr)).toMatchObject([{ kind: 'error', code: 'report-failed' }]);
    for (const line of parseLines(result.stderr)) expect(validateEvent(line)).toBe(true);
  });
});
