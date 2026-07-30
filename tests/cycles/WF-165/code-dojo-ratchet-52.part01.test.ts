import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CODE_SIZE_BASELINE } from '../../../scripts/code-size-gate.js';
import { splitModuleFamily } from '../DX-050/split-module-family.js';
import {
  extractBashCommandBlocks,
  expectClaims,
} from '../WF-130/roadmap-goalpost-policy.test-support.js';
import { TRANCHE_A_ROOTS } from './tranche-a-contract.js';

const ROOT = resolve(import.meta.dirname, '../../..');
const MAX_LINES = 150;
const MAX_BYTES = 12_000;

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

function fileContextPaths(): readonly string[] {
  const parsed: unknown = JSON.parse(
    read('scripts/code-dojo/baselines/file-context.json'),
  );
  if (
    parsed == null
    || typeof parsed !== 'object'
    || !('files' in parsed)
    || !Array.isArray(parsed.files)
  ) {
    throw new Error('invalid file/context baseline');
  }
  return parsed.files.map((entry: unknown) => {
    if (
      entry == null
      || typeof entry !== 'object'
      || !('path' in entry)
      || typeof entry.path !== 'string'
    ) {
      throw new Error('invalid file/context baseline entry');
    }
    return entry.path;
  });
}

function debtScript(): string | undefined {
  const parsed: unknown = JSON.parse(read('package.json'));
  if (
    parsed == null
    || typeof parsed !== 'object'
    || !('scripts' in parsed)
    || parsed.scripts == null
    || typeof parsed.scripts !== 'object'
  ) {
    throw new Error('package.json scripts must be an object');
  }
  if (!('code-dojo:debt' in parsed.scripts)) return undefined;
  const command = parsed.scripts['code-dojo:debt'];
  return typeof command === 'string' ? command : undefined;
}

describe('WF-165 Code Dojo tranche A debt contract', () => {
  it('removes five double-counted roots and lowers debt to 52', () => {
    const contextPaths = fileContextPaths();
    const codeSizePaths = CODE_SIZE_BASELINE.map((entry) => entry.path);

    expect(TRANCHE_A_ROOTS).toHaveLength(5);
    expect(contextPaths).toHaveLength(32);
    expect(codeSizePaths).toHaveLength(20);
    expect(debtScript()).toBe('tsx scripts/code-dojo-debt.ts --max 52');
    for (const root of TRANCHE_A_ROOTS) {
      expect(contextPaths, root).not.toContain(root);
      expect(codeSizePaths, root).not.toContain(root);
    }
  });

  it('keeps every split-family file within the strict context gate', () => {
    for (const entrypoint of TRANCHE_A_ROOTS) {
      const files = splitModuleFamily(resolve(ROOT, entrypoint));
      expect(files.length, entrypoint).toBeGreaterThan(1);
      for (const file of files) {
        const source = readFileSync(file, 'utf8');
        const lines = source.split(/\r?\n/u).length;
        const bytes = Buffer.byteLength(source, 'utf8');
        expect(
          lines <= MAX_LINES && bytes <= MAX_BYTES,
          `${file} is ${String(lines)} lines / ${String(bytes)} bytes`,
        ).toBe(true);
      }
    }
  });

  it('replays every cycle suite changed by tranche A', () => {
    const commands = extractBashCommandBlocks(
      read('docs/design/WF-165-respecting-dojo-ratchet-12.md'),
    );
    const cycleCommand = commands.find((command) =>
      command.includes('tests/cycles/WF-165'),
    );
    expectClaims(cycleCommand ?? '', [
      'tests/cycles/DX-050',
      'tests/cycles/RE-036',
      'tests/cycles/WF-130',
      'tests/cycles/WF-163',
      'tests/cycles/WF-164',
      'tests/cycles/WF-165',
    ]);
  });
});
