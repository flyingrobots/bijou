import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { createNodeSoakHost, parseSoakArgs } from './soak-node.js';
import { resolveSoakOptions } from './soak-ports.js';
import { entryOf, run, signature } from './soak-host.test-support.js';

const dir = mkdtempSync(join(tmpdir(), 'soak-host-'));
afterAll(() => { rmSync(dir, { recursive: true, force: true }); });

describe('soak bench through host ports', () => {
  it('a scripted Node run keeps the frames and log lines it had before the ports', async () => {
    const out = join(dir, 'golden.jsonl');
    const host = createNodeSoakHost(['--cycles=1', '--dwell=0.1', '--fps=30', `--out=${out}`]);
    const result = await run(host);
    const all = result.frames.map(signature);
    const frames = all.filter((h, i) => h !== all[i - 1]);
    const log = readFileSync(out, 'utf8').trim().split('\n').map((l) => {
      const o = entryOf(l);
      return { keys: Object.keys(o), cycle: o.cycle, scenario: o.scenario, frames: o.frames };
    });
    const golden: unknown = JSON.parse(readFileSync(new URL('./soak-golden.json', import.meta.url), 'utf8'));
    expect({ frames, log }).toEqual(golden);
  });

  it('options parsed from arguments equal the same options passed as an object', () => {
    const parsed = parseSoakArgs(['--cycles=2', '--fps=15', '--dwell=0.5', '--out=x.jsonl']).options;
    expect(parsed).toEqual({ cycles: 2, fps: 15, dwell: 0.5 });
    expect(parsed).toEqual(resolveSoakOptions({ cycles: 2, fps: 15, dwell: 0.5 }));
    expect(parseSoakArgs(['--fps=nope']).options).toEqual(resolveSoakOptions());
  });
});
