import { describe, expect, it } from 'vitest';
import { parseSmokeRunOptions } from './smoke-all-examples-lib.js';

describe('parseSmokeRunOptions', () => {
  it('parses fast, skip-build, and pipe concurrency flags', () => {
    expect(parseSmokeRunOptions([
      '--fast',
      '--skip-build',
      '--pipe-concurrency=2',
    ])).toEqual({
      fast: true,
      skipBuild: true,
      pipeConcurrency: 2,
    });
  });

  it('collects repeated mode flags', () => {
    expect(parseSmokeRunOptions([
      '--mode=pipe',
      '--mode=interactive-scripted',
    ])).toEqual({
      modes: ['pipe', 'interactive-scripted'],
    });
  });

  it('rejects unknown or malformed flags', () => {
    expect(() => parseSmokeRunOptions(['--wat'])).toThrow('unknown smoke:examples option');
    expect(() => parseSmokeRunOptions(['--pipe-concurrency=nope'])).toThrow('invalid --pipe-concurrency value');
    expect(() => parseSmokeRunOptions(['--mode=banana'])).toThrow('invalid --mode value');
  });
});
