// vitest: isolate (sets the process umask for the whole file)
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { MARKER } from './constants.mjs';
import { writeToolchainContext } from './toolchain-context.mjs';

const BASE = `node:22-bookworm@sha256:${'a'.repeat(64)}`;
const scratch: string[] = [];

afterEach(() => {
  for (const dir of scratch.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function context(): string {
  const dir = mkdtempSync(join(tmpdir(), 'seal-toolchain-context-'));
  scratch.push(dir);
  return dir;
}

describe('sealed toolchain build context', () => {
  it('leaves the seal marker world-readable under a restrictive host umask', () => {
    const dir = context();
    const previous = process.umask(0o027);
    try {
      writeToolchainContext(dir, BASE);
    } finally {
      process.umask(previous);
    }
    // The worker runs as 1000:1000 and must read the root-owned marker it was copied to.
    expect(statSync(join(dir, 'marker')).mode & 0o777).toBe(0o444);
    expect(readFileSync(join(dir, 'marker'), 'utf8')).toBe(MARKER);
  });

  it('writes a Dockerfile with no RUN step that either builder can build', () => {
    const dir = context();
    writeToolchainContext(dir, BASE);
    const dockerfile = readFileSync(join(dir, 'Dockerfile'), 'utf8');

    expect(dockerfile.startsWith(`FROM ${BASE}\n`)).toBe(true);
    expect(dockerfile).toContain('COPY marker /etc/bijou-test-seal\n');
    // --chmod needs BuildKit; the legacy builder refuses it.
    expect(dockerfile).not.toContain('--chmod');
    expect(dockerfile).toContain('USER 1000:1000\n');
    expect(dockerfile).not.toMatch(/^RUN\b/mu);
  });
});
