import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { renderSummary, type JobRecord } from './summary.mjs';

const at = (time: string): string => `2026-01-01T${time}Z`;
const job = (name: string, start: string | null, end: string | null, conclusion: string | null): JobRecord => ({
  name,
  start: start == null ? null : at(start),
  end: end == null ? null : at(end),
  conclusion,
});
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === 'object' && !Array.isArray(value);
const rowNames = (markdown: string): string[] =>
  markdown.split('\n').filter((line) => /^\| \d+ \|/.test(line)).map((line) => line.split(/(?<!\\)\|/)[2]?.trim() ?? '');

describe('renderSummary', () => {
  it('lists jobs slowest first with minutes and seconds', () => {
    const markdown = renderSummary([
      job('lint', '00:00:00', '00:00:45', 'success'),
      job('test', '00:00:00', '00:12:05', 'success'),
    ]);

    expect(rowNames(markdown)).toEqual(['test', 'lint']);
    expect(markdown).toContain('| 1 | test | 12m 05s | success |');
    expect(markdown).toContain('| 2 | lint | 45s | success |');
  });

  it('lists failed jobs as failed and ranks them by wall time', () => {
    const markdown = renderSummary([
      job('a', '00:00:00', '00:01:00', 'success'),
      job('b', '00:00:00', '00:02:00', 'failure'),
    ]);

    expect(markdown).toContain('| 1 | b | 2m 00s | failure |');
  });

  it('lists skipped and in-progress jobs after finished ones without a wall time', () => {
    const markdown = renderSummary([
      job('skipped-job', '00:00:00', '00:00:00', 'skipped'),
      job('running', '00:00:00', null, null),
      job('done', '00:00:00', '00:00:03', 'success'),
    ]);

    expect(rowNames(markdown)).toEqual(['done', 'skipped-job', 'running']);
    expect(markdown).toContain('| 2 | skipped-job | n/a | skipped |');
    expect(markdown).toContain('| 3 | running | n/a | in progress |');
  });

  it('lists a cancelled job with its wall time', () => {
    const markdown = renderSummary([job('cancelled-job', '00:00:00', '00:00:30', 'cancelled')]);

    expect(markdown).toContain('| 1 | cancelled-job | 30s | cancelled |');
  });

  it('says so when there are no jobs', () => {
    const markdown = renderSummary([]);

    expect(markdown).toContain('No jobs were reported for this run.');
    expect(rowNames(markdown)).toEqual([]);
  });

  it('keeps matrix jobs as separate rows and escapes table pipes', () => {
    const markdown = renderSummary([
      job('Unit (linux, Node 22)', '00:00:00', '00:01:00', 'success'),
      job('Unit (windows, Node 22)', '00:00:00', '00:03:00', 'success'),
      job('odd | name', '00:00:00', '00:00:10', 'success'),
    ]);

    expect(rowNames(markdown)).toEqual(['Unit (windows, Node 22)', 'Unit (linux, Node 22)', 'odd \\| name']);
  });

  it('treats a missing timestamp on a finished job as n/a', () => {
    expect(renderSummary([job('x', null, null, 'success')])).toContain('| 1 | x | n/a | success |');
  });
});

describe('CI workflow wall-time summary contract', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const jobs = new Map<string, Record<string, unknown>>();
  const parsed: unknown = parse(workflow);
  const rawJobs = isRecord(parsed) ? parsed['jobs'] : undefined;
  if (isRecord(rawJobs)) {
    for (const [id, definition] of Object.entries(rawJobs)) {
      if (isRecord(definition)) jobs.set(id, definition);
    }
  }

  it('has a final, non-blocking, read-only summary job that runs the script', () => {
    const summary = jobs.get('wall_time_summary');
    expect(summary?.['name']).toBe('Wall time summary');
    expect(summary?.['if']).toBe('always()');
    expect(summary?.['continue-on-error']).toBe(true);
    expect(summary?.['permissions']).toEqual({ actions: 'read', contents: 'read' });
    expect(JSON.stringify(summary?.['steps'])).toContain('node scripts/ci-wall-time/publish.mjs');
    expect(summary?.['needs']).toEqual([...jobs.keys()].filter((id) => id !== 'wall_time_summary'));
  });

  it('is not required by any other job', () => {
    for (const [id, definition] of jobs) {
      if (id !== 'wall_time_summary') expect(JSON.stringify(definition['needs'] ?? [])).not.toContain('wall_time_summary');
    }
  });
});
