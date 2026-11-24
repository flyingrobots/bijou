import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ROOT = new URL('../', import.meta.url);

function scripts(): Readonly<Record<string, string>> {
  const parsed: unknown = JSON.parse(readFileSync(new URL('package.json', ROOT), 'utf8'));
  if (parsed == null || typeof parsed !== 'object' || !('scripts' in parsed)) throw new Error('package.json has no scripts');
  const value: unknown = parsed.scripts;
  if (value == null || typeof value !== 'object') throw new Error('package.json scripts is not an object');
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}

function steps(command: string | undefined): string[] {
  return (command ?? '').split('&&').map((step) => step.trim());
}

describe('runtime SCC ratchet wiring', () => {
  it('exposes the check as code-dojo:cycles', () => {
    expect(scripts()['code-dojo:cycles']).toBe('tsx scripts/code-dojo-runtime-scc.ts --check');
  });

  it('runs in the hosted Code Dojo lane and the local full gate', () => {
    const workflow = readFileSync(new URL('.github/workflows/code-dojo.yml', ROOT), 'utf8');

    expect(workflow).toContain('npm run code-dojo:verify');
    expect(steps(scripts()['code-dojo:verify'])).toContain('npm run code-dojo:cycles');
    expect(steps(scripts()['code-dojo:ci'])).toContain('npm run code-dojo:cycles');
  });
});
