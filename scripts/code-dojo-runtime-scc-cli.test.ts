import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { RUNTIME_SCC_INVENTORY_PATH, runRuntimeScc, type RuntimeSccRun } from './code-dojo-runtime-scc-cli.js';
import {
  createSccFixtureRoot, importing, removeFixtureFile, removeFixtureRoot, writeFixtureFiles,
} from './code-dojo-runtime-scc-fixture.js';
import { eventLines, validateEvent, validateInventory } from './code-dojo-runtime-scc-schemas.test-support.js';

const roots: string[] = [];
const pair = { 'scripts/a.ts': importing('./b.js'), 'scripts/b.ts': importing('./a.js') };

function root(files: Readonly<Record<string, string>>): string {
  const created = createSccFixtureRoot(files);
  roots.push(created);
  return created;
}

function run(args: readonly string[], cwd: string): RuntimeSccRun {
  const result = runRuntimeScc(args, cwd);
  for (const line of eventLines([...result.stdout, ...result.stderr])) {
    expect(validateEvent(line), JSON.stringify(validateEvent.errors)).toBe(true);
  }
  return result;
}

function kinds(lines: readonly string[]): unknown[] {
  return eventLines(lines).map((line) => (typeof line === 'object' && line != null && 'kind' in line ? line.kind : null));
}

describe('runtime SCC inventory command', () => {
  afterEach(() => {
    for (const created of roots.splice(0)) removeFixtureRoot(created);
  });

  it('writes a schema-valid inventory only with --accept-growth, then --check holds', () => {
    const cwd = root(pair);
    const refused = run(['--write'], cwd);
    const written = run(['--write', '--accept-growth'], cwd);
    const inventory: unknown = JSON.parse(readFileSync(join(cwd, RUNTIME_SCC_INVENTORY_PATH), 'utf8'));
    const checked = run(['--check'], cwd);

    expect(refused.code).toBe(1);
    expect(kinds(refused.stderr)).toEqual(['violation', 'error']);
    expect(eventLines(refused.stderr)[1]).toMatchObject({ code: 'growth-not-accepted' });
    expect(written.code).toBe(0);
    expect(kinds(written.stdout)).toEqual(['graph-built', 'inventory-written']);
    expect(validateInventory(inventory), JSON.stringify(validateInventory.errors)).toBe(true);
    expect(checked.code).toBe(0);
    expect(kinds(checked.stdout)).toEqual(['graph-built', 'inventory-current']);
  });

  it('fails a new cycle and a grown cycle with violation lines', () => {
    const cwd = root(pair);
    run(['--write', '--accept-growth'], cwd);
    writeFixtureFiles(cwd, { 'scripts/c.ts': importing('./d.js'), 'scripts/d.ts': importing('./c.js') });
    const fresh = run([], cwd);
    writeFixtureFiles(cwd, { 'scripts/b.ts': importing('./a.js', './c.js'), 'scripts/d.ts': importing('./a.js') });
    const grown = run([], cwd);

    expect(fresh.code).toBe(1);
    expect(eventLines(fresh.stderr)).toMatchObject([{ kind: 'violation', code: 'new-component' }, { code: 'ratchet-failed' }]);
    expect(grown.code).toBe(1);
    expect(eventLines(grown.stderr)).toMatchObject([{ kind: 'violation', code: 'grown-component' }, { code: 'ratchet-failed' }]);
  });

  it('fails a shrunk or removed cycle as stale until regenerated, then passes', () => {
    const cwd = root({ ...pair, 'scripts/c.ts': importing('./a.js'), 'scripts/b.ts': importing('./a.js', './c.js') });
    run(['--write', '--accept-growth'], cwd);
    writeFixtureFiles(cwd, { 'scripts/b.ts': importing('./a.js') });
    const shrunk = run([], cwd);
    const regenerated = run(['--write'], cwd);
    const afterShrink = run([], cwd);
    removeFixtureFile(cwd, 'scripts/b.ts');
    const removed = run([], cwd);
    run(['--write'], cwd);
    const afterRemoval = run([], cwd);

    expect(shrunk.code).toBe(1);
    expect(eventLines(shrunk.stderr)).toMatchObject([{ kind: 'error', code: 'inventory-stale' }]);
    expect(regenerated.code).toBe(0);
    expect(afterShrink.code).toBe(0);
    expect(removed.code).toBe(1);
    expect(eventLines(removed.stderr)).toMatchObject([{ kind: 'error', code: 'inventory-stale' }]);
    expect(afterRemoval.code).toBe(0);
    expect(JSON.parse(readFileSync(join(cwd, RUNTIME_SCC_INVENTORY_PATH), 'utf8'))).toMatchObject({ componentCount: 0 });
  });

  it('reports a missing, invalid or inconsistent inventory as an error line', () => {
    const cwd = root(pair);
    const missing = run([], cwd);
    run(['--write', '--accept-growth'], cwd);
    const path = join(cwd, RUNTIME_SCC_INVENTORY_PATH);
    writeFileSync(path, readFileSync(path, 'utf8').replace('"componentCount": 1', '"componentCount": 2'));
    const inconsistent = run([], cwd);

    expect(eventLines(missing.stderr)).toMatchObject([{ code: 'inventory-missing' }]);
    expect(eventLines(inconsistent.stderr)).toMatchObject([{ code: 'inventory-invalid' }]);
  });

  it('answers --help and --schema with JSON Lines, and --human with prose', () => {
    const cwd = root(pair);
    const help = run(['--help'], cwd);
    const schema = run(['--schema'], cwd);
    const bad = run(['--bogus'], cwd);
    const human = runRuntimeScc(['--human', '--write', '--accept-growth'], cwd);

    expect(help.code).toBe(0);
    expect(kinds(help.stdout)).toEqual(['help', 'schema', 'schema']);
    expect(schema.code).toBe(0);
    expect(kinds(schema.stdout)).toEqual(['schema', 'schema']);
    expect(bad.code).toBe(1);
    expect(eventLines(bad.stderr)).toMatchObject([{ code: 'bad-arguments' }]);
    expect(human.code).toBe(0);
    expect(human.stdout.join('\n')).toContain('runtime SCC inventory written');
    expect(() => eventLines(human.stdout)).toThrow();
  });
});
