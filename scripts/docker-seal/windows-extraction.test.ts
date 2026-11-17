import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { gitExtractionCommands } from './windows-extraction.mjs';

describe('Windows Git toolchain extraction', () => {
  it('decompresses bzip2 before tar so tar never pipes through an external filter', () => {
    const steps = gitExtractionCommands('S', 'T');
    expect(steps.map((step) => step.label)).toEqual(['decompress-git', 'extract-git']);
    expect(steps[0]?.argv).toEqual(['bzip2', '-d', join('S', 'git.tar.bz2')]);
    expect(steps[1]?.argv).toEqual(['tar.exe', '-xf', join('S', 'git.tar'), '-C', 'T']);
  });

  it('bounds each step independently', () => {
    for (const step of gitExtractionCommands('S', 'T')) expect(step.timeout).toBeGreaterThan(0);
  });
});
