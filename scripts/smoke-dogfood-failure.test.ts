import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DOGFOOD_SCENARIOS } from './smoke-dogfood-lib.part01.js';
import { runSmokeDogfood } from './smoke-dogfood-lib.part03.js';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

async function runCapture(source: string) {
  const root = mkdtempSync(join(tmpdir(), 'bijou-smoke-failure-'));
  roots.push(root);
  mkdirSync(join(root, 'examples/docs'), { recursive: true });
  symlinkSync(resolve(import.meta.dirname, '../node_modules'), join(root, 'node_modules'), 'junction');
  writeFileSync(join(root, 'examples/docs/capture-main.ts'), source);
  const output: string[] = [];
  const status = await runSmokeDogfood({
    cwd: root, options: { skipBuild: true, scenarios: ['landing'] },
    stdout: (text) => output.push(text),
  });
  return { status, output: output.join('') };
}

describe.skipIf(process.platform === 'win32')('DOGFOOD failure evidence from a real capture process', () => {
  it('prints the actual missing-file error when capture crashes before its first frame', async () => {
    const result = await runCapture(`
      import { readFileSync } from 'node:fs';
      readFileSync(new URL('./missing-release-note.md', import.meta.url));
    `);
    expect(result.status).toBe(1);
    expect(result.output).toContain('FAIL: exited with code');
    expect(result.output).toContain('Captured output');
    expect(result.output).toContain('ENOENT');
    expect(result.output).toContain('missing-release-note.md');
  }, 20_000);

  it('bounds a large failure tail by both lines and characters', async () => {
    const result = await runCapture(`
      console.log('discard-this-early-output');
      for (let i = 0; i < 100; i += 1) console.log('old-line-' + i);
      console.log('x'.repeat(12000));
      console.error('LAST-ERROR');
      process.exit(23);
    `);
    expect(result.status).toBe(1);
    expect(result.output).toContain('LAST-ERROR');
    expect(result.output).not.toContain('discard-this-early-output');
    expect(result.output.length).toBeLessThan(4500);
    expect(result.output.split('\n').length).toBeLessThan(50);
  }, 20_000);

  it('keeps successful capture output quiet', async () => {
    const snippets = DOGFOOD_SCENARIOS.landing.requiredSnippets.join('\n');
    const result = await runCapture(`console.log(${JSON.stringify(snippets)});`);
    expect(result).toEqual({ status: 0, output: 'smoke dogfood:landing ... ok\n' });
  }, 20_000);

  it('limits a failure containing many short lines', async () => {
    const result = await runCapture(`
      for (let i = 0; i < 100; i += 1) console.log('line-' + i);
      process.exit(23);
    `);
    expect(result.status).toBe(1);
    expect(result.output).toContain('line-99');
    expect(result.output).not.toContain('line-10\n');
    expect(result.output.split('\n').length).toBeLessThan(50);
  }, 20_000);

  it('omits an empty capture tail', async () => {
    const result = await runCapture('process.exit(23);');
    expect(result.status).toBe(1);
    expect(result.output).toContain('exited with code 23');
    expect(result.output).not.toContain('Captured output');
  }, 20_000);
});
