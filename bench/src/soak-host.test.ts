import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { surfaceToString } from '@flyingrobots/bijou';
import { runScript } from '@flyingrobots/bijou-tui';
import { createSoakApp } from './soak-app.js';
import { initScenario, logAndAdvanceCmd } from './soak-scenarios.js';
import { createNodeSoakHost, parseSoakArgs } from './soak-node.js';
import { NO_MEMORY, resolveSoakOptions, type SoakHost } from './soak-ports.js';

const dir = mkdtempSync(join(tmpdir(), 'soak-host-'));
afterAll(() => { rmSync(dir, { recursive: true, force: true }); });

const ctx = createTestContext();
const steps = (perfOff: boolean) => [
  ...(perfOff ? [{ key: '`' }] : []),
  ...Array.from({ length: 400 }, () => ({ pulse: { dt: 0.05 } })),
];
const mask = (s: string) => s.replace(/[\d.]+\s?(ns|µs|ms|s)\/frame/g, 'T/frame');
const run = (host: SoakHost, perfOff = true) =>
  runScript(createSoakApp(ctx, host), steps(perfOff), { ctx, pulseFps: false });

describe('soak bench through host ports', () => {
  it('a scripted Node run keeps the frames and log lines it had before the ports', async () => {
    const out = join(dir, 'golden.jsonl');
    const host = createNodeSoakHost(['--cycles=1', '--dwell=0.1', '--fps=30', `--out=${out}`]);
    const result = await run(host);
    const frames = result.frames.map((f) => createHash('sha256').update(mask(surfaceToString(f, ctx.style))).digest('hex').slice(0, 16));
    const log = readFileSync(out, 'utf8').trim().split('\n').map((l) => {
      const o = JSON.parse(l) as Record<string, unknown>;
      return { keys: Object.keys(o), cycle: o.cycle, scenario: o.scenario, frames: o.frames };
    });
    const golden = JSON.parse(readFileSync(new URL('./soak-golden.json', import.meta.url), 'utf8')) as unknown;
    expect({ frameCount: frames.length, frames, log }).toEqual(golden);
  });

  it('options parsed from arguments equal the same options passed as an object', () => {
    const parsed = parseSoakArgs(['--cycles=2', '--fps=15', '--dwell=0.5', '--out=x.jsonl']).options;
    expect(parsed).toEqual({ cycles: 2, fps: 15, dwell: 0.5 });
    expect(parsed).toEqual(resolveSoakOptions({ cycles: 2, fps: 15, dwell: 0.5 }));
    expect(parseSoakArgs(['--fps=nope']).options).toEqual(resolveSoakOptions());
  });

  it('a memory port that reports nothing leaves no heap or resident row, and no zero', async () => {
    const result = await run({ options: resolveSoakOptions({ cycles: 1, dwell: 0.1 }), memory: NO_MEMORY, log: () => {} }, false);
    const text = result.frames.map((f) => surfaceToString(f, ctx.style)).join('\n');
    expect(text).toContain('Perf');
    expect(text).not.toMatch(/heap|rss/i);
  });

  it('a memory port that reports only heap shows the heap row and not the resident row', async () => {
    const memory = () => ({ heapUsedMB: 12.5, rssMB: undefined });
    const result = await run({ options: resolveSoakOptions({ cycles: 1, dwell: 0.1 }), memory, log: () => {} }, false);
    const text = result.frames.map((f) => surfaceToString(f, ctx.style)).join('\n');
    expect(text).toMatch(/heap/i);
    expect(text).toContain('12.5');
    expect(text).not.toMatch(/rss/i);
  });

  it('a log line omits a figure the host cannot measure', async () => {
    const lines: string[] = [];
    await run({ options: resolveSoakOptions({ cycles: 1, dwell: 0.1 }), memory: () => ({ heapUsedMB: 3, rssMB: undefined }), log: (l) => { lines.push(l); } });
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      const entry = JSON.parse(line) as Record<string, unknown>;
      expect(entry.heapUsedMB).toBe(3);
      expect('rssMB' in entry).toBe(false);
    }
  });

  it('a log sink that throws ends the run with the sink error, as a failed append always did', () => {
    const log = () => { throw new Error('disk full'); };
    const host = { options: resolveSoakOptions({ cycles: 1, dwell: 0.1 }), memory: NO_MEMORY, log };
    const model = initScenario(0, 0, 80, 24);
    expect(() => logAndAdvanceCmd(model, host)()).toThrow('disk full');
  });
});
