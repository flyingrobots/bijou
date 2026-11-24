import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

// flyingrobots/bijou#907. Dependency preparation installs the producer graph
// from the lockfile and then warms npm's cache for the consumer graphs that
// the packaging smokes install offline. The Vitest suite installs nothing: it
// passed in the sealed runner with that warm-up skipped (2026-11-24), and the
// warm-up was 12 to 15 s of every suite shard. A run can ask to skip it.
const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');

interface Step { readonly name?: string; readonly run?: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function steps(job: string): readonly Step[] {
  const workflow: unknown = parse(read('../../.github/workflows/ci.yml'));
  const jobs = isRecord(workflow) ? workflow['jobs'] : undefined;
  const found = isRecord(jobs) ? jobs[job] : undefined;
  const list = isRecord(found) ? found['steps'] : undefined;
  if (!Array.isArray(list)) throw new Error(`no steps for job ${job}`);
  return list.filter(isRecord).map((step) => ({
    ...(typeof step['name'] === 'string' ? { name: step['name'] } : {}),
    ...(typeof step['run'] === 'string' ? { run: step['run'] } : {}),
  }));
}

describe('the sealed runner can leave the consumer graphs unprepared', () => {
  it('takes the option in the session and refuses an unknown one as before', () => {
    const session = read('./session.mjs');
    expect(session).toContain("argv[i] === '--no-consumer-graphs'");
    expect(session).toContain('throw new Error(`Unknown runner option: ${argv[i]}`)');
  });

  it('hands the choice to the dependency worker as an argument, never an environment variable', () => {
    const prepare = read('./prepare.mjs');
    expect(prepare).toContain("'/work/control/dependencies.mjs', ...(consumerGraphs ? [] : ['--no-consumer-graphs'])");
    expect(read('./dependencies.mjs')).toContain("process.argv.includes('--no-consumer-graphs')");
  });

  it('still installs the producer graph from the lockfile first, whatever the option says', () => {
    const dependencies = read('./dependencies.mjs');
    const install = dependencies.indexOf("npm(['ci', '--ignore-scripts', '--no-audit', '--fund=false']);");
    const skip = dependencies.indexOf("process.argv.includes('--no-consumer-graphs')");
    expect(install).toBeGreaterThan(0);
    expect(skip).toBeGreaterThan(install);
  });

  it('is used by the full-suite shards and by no job that installs packed packages', () => {
    const suite = steps('suite').find((step) => step.name === 'Full test suite');
    expect(suite?.run).toContain('run.mjs --isolated-ci --no-consumer-graphs ');
    for (const job of ['test', 'smoke_gates', 'smoke_dogfood', 'unit_cross_platform']) {
      for (const step of steps(job)) expect(step.run ?? '', `${job}: ${step.name ?? ''}`).not.toContain('--no-consumer-graphs');
    }
  });
});
