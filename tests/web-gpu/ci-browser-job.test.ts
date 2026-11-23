import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

// Every CI test enters the sealed runner except the web-gpu browser suite,
// which needs a browser and a GPU the seal does not have. These cases keep
// that exception to the one script and keep the showcase build sealed.
type Fields = Readonly<Record<string, unknown>>;
function isFields(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function fields(value: unknown, label: string): Fields {
  if (!isFields(value)) throw new Error(`${label} is not a mapping`);
  return value;
}
function steps(job: Fields, label: string): readonly Fields[] {
  const list: unknown = job['steps'];
  if (!Array.isArray(list)) throw new Error(`${label}.steps is not a sequence`);
  return list.map((step, index) => fields(step, `${label}.steps[${String(index)}]`));
}

const workflow: unknown = parse(readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8'));
const jobs = fields(fields(workflow, 'workflow')['jobs'], 'jobs');

describe('CI web-gpu lanes', () => {
  it('runs only npm ci and the browser suite outside the seal', () => {
    const runs = steps(fields(jobs['browser_web_gpu'], 'browser_web_gpu'), 'browser_web_gpu')
      .map((step) => step['run'])
      .filter((run) => typeof run === 'string');
    expect(runs).toEqual([
      'npm ci --ignore-scripts --no-audit --fund=false',
      'google-chrome --version',
      'npm run test:browser:web-gpu',
    ]);
  });

  it('builds and typechecks the showcase inside the sealed runner', () => {
    const build = steps(fields(jobs['test'], 'test'), 'test').find((step) => step['name'] === 'Build and typecheck the web-gpu showcase');
    expect(build?.['run']).toBe("node scripts/docker-seal/run.mjs --isolated-ci -- bash -lc 'npm run web-gpu:build && npm run web-gpu:typecheck'");
  });
});
