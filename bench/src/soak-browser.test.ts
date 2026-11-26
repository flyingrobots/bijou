import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '@flyingrobots/bijou-tui';
import { displayScenarios } from './soak-config.js';
import { browserMemory, createBrowserSoak, createLogBuffer } from './soak-browser.js';
import { parseSoakQuery } from './soak-query.js';

const scenarioContext = () => createTestContext({ mode: 'interactive' });
const ids = displayScenarios.map((s) => s.id);

describe('the soak options a browser address chooses', () => {
  it('are the defaults with no query, and ignore the keys the page itself uses', () => {
    expect(parseSoakQuery('')).toEqual({ ok: true, options: { cycles: Infinity, fps: 30, dwell: 4 } });
    expect(parseSoakQuery('?app=soak&backend=canvas2d')).toEqual(parseSoakQuery(''));
  });

  it('take the cycles, frame rate, dwell and first scenario that are given', () => {
    const first = ids[2] ?? '';
    expect(parseSoakQuery(`?cycles=3&fps=15&dwell=0.5&scenario=${first}`)).toEqual({ ok: true, options: { cycles: 3, fps: 15, dwell: 0.5, scenario: first } });
  });

  it.each([
    ['cycles=0', 'cycles'], ['cycles=1.5', 'cycles'], ['cycles=abc', 'cycles'], ['cycles=', 'cycles'], ['cycles=1&cycles=2', 'cycles'],
    ['fps=0', 'fps'], ['fps=-5', 'fps'], ['fps=1000', 'fps'], ['fps=NaN', 'fps'],
    ['dwell=0', 'dwell'], ['dwell=Infinity', 'dwell'], ['scenario=nope', 'scenario'],
  ])('refuse %s with a message that names the value, and never fall back to a default', (query, name) => {
    const result = parseSoakQuery(`?${query}`);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain(name);
  });
});

describe('the memory reading of a browser', () => {
  it('is a heap figure in megabytes where the browser measures one, and never a resident figure', () => {
    expect(browserMemory({ memory: { usedJSHeapSize: 52_428_800 } })).toEqual({ heapUsedMB: 50, rssMB: undefined });
  });

  it.each([
    ['no performance object', undefined], ['no memory member', {}], ['a memory with no heap size', { memory: {} }],
    ['a heap size that is not a number', { memory: { usedJSHeapSize: '5' } }], ['a heap size of zero', { memory: { usedJSHeapSize: 0 } }],
    ['a heap size that is not finite', { memory: { usedJSHeapSize: Infinity } }],
  ])('is nothing at all with %s, never a zero', (_name, source) => {
    expect(browserMemory(source)).toEqual({ heapUsedMB: undefined, rssMB: undefined });
  });
});

describe('the log a browser keeps', () => {
  it('holds the last lines in order, and drops the oldest past its limit', () => {
    const log = createLogBuffer(3);
    for (const line of ['a', 'b', 'c', 'd']) log.sink(line);
    expect(log.lines()).toEqual(['b', 'c', 'd']);
  });

  it('hands out a copy, so a reader cannot change what is kept', () => {
    const log = createLogBuffer(3);
    log.sink('a');
    const read = [...log.lines()];
    read.push('x');
    expect(log.lines()).toEqual(['a']);
  });
});

describe('the soak bench in a browser host', () => {
  it('refuses an invalid query by throwing its message', () => {
    expect(() => createBrowserSoak('?cycles=0', scenarioContext)).toThrow('cycles');
  });

  it('runs one cycle, logs a line per scenario, and reports a heap figure only', async () => {
    const soak = createBrowserSoak('?cycles=1&dwell=0.1', scenarioContext, () => ({ heapUsedMB: 7, rssMB: undefined }));
    const ctx = createTestContext();
    const steps = Array.from({ length: 400 }, () => ({ pulse: { dt: 0.05 } }));
    await runScript(soak.app(ctx), steps, { ctx, pulseFps: false });
    const lines = soak.lines().map((line): unknown => JSON.parse(line));
    expect(lines.length).toBe(displayScenarios.length);
    for (const entry of lines) {
      expect(entry).toMatchObject({ cycle: 0, heapUsedMB: 7 });
      expect(entry).not.toHaveProperty('rssMB');
    }
  });

  it('starts at the scenario the query names', async () => {
    const first = ids[3] ?? '';
    const soak = createBrowserSoak(`?cycles=1&dwell=0.1&scenario=${first}`, scenarioContext);
    const ctx = createTestContext();
    await runScript(soak.app(ctx), Array.from({ length: 20 }, () => ({ pulse: { dt: 0.05 } })), { ctx, pulseFps: false });
    expect(soak.lines().map((line): unknown => JSON.parse(line))[0]).toMatchObject({ scenario: first });
  });
});
