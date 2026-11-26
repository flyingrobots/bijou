import { describe, expect, it } from 'vitest';
import { surfaceToString } from '@flyingrobots/bijou';
import { initScenario, logAndAdvanceCmd } from './soak-scenarios.js';
import { NO_MEMORY, resolveSoakOptions } from './soak-ports.js';
import { ctx, entryOf, NO_LOG, run, scenarioContext } from './soak-host.test-support.js';

describe('soak bench through host ports', () => {
  it('a memory port that reports nothing leaves no heap or resident row, and no zero', async () => {
    const result = await run({ options: resolveSoakOptions({ cycles: 1, dwell: 0.1 }), memory: NO_MEMORY, log: NO_LOG, scenarioContext }, false);
    const text = result.frames.map((f) => surfaceToString(f, ctx.style)).join('\n');
    expect(text).toContain('Perf');
    expect(text).not.toMatch(/heap|rss/i);
  });

  it('a memory port that reports only heap shows the heap row and not the resident row', async () => {
    const memory = () => ({ heapUsedMB: 12.5, rssMB: undefined });
    const result = await run({ options: resolveSoakOptions({ cycles: 1, dwell: 0.1 }), memory, log: NO_LOG, scenarioContext }, false);
    const text = result.frames.map((f) => surfaceToString(f, ctx.style)).join('\n');
    expect(text).toMatch(/heap/i);
    expect(text).toContain('12.5');
    expect(text).not.toMatch(/rss/i);
  });

  it('a log line omits a figure the host cannot measure', async () => {
    const lines: string[] = [];
    await run({ options: resolveSoakOptions({ cycles: 1, dwell: 0.1 }), memory: () => ({ heapUsedMB: 3, rssMB: undefined }), log: (l) => { lines.push(l); }, scenarioContext });
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      const entry = entryOf(line);
      expect(entry.heapUsedMB).toBe(3);
      expect('rssMB' in entry).toBe(false);
    }
  });

  it('a log sink that throws ends the run with the sink error, as a failed append always did', () => {
    const log = () => { throw new Error('disk full'); };
    const host = { options: resolveSoakOptions({ cycles: 1, dwell: 0.1 }), memory: NO_MEMORY, log, scenarioContext };
    const model = initScenario(host, 0, 0, 80, 24);
    const capabilities = { onPulse: () => ({ dispose: NO_LOG }) };
    expect(() => logAndAdvanceCmd(model, host)(NO_LOG, capabilities)).toThrow('disk full');
  });
});
