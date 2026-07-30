import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CODE_SIZE_BASELINE } from '../../../scripts/code-size-gate.js';
import { splitModuleFamily } from '../DX-050/split-module-family.js';
import {
  extractBashCommandBlocks,
  expectClaims,
} from '../WF-130/roadmap-goalpost-policy.test-support.js';
import {
  parseFileContextBaseline,
  validateLiveFileContextBaseline,
} from './file-context-baseline-contract.js';
import { TRANCHE_A_ROOTS } from './tranche-a-contract.js';

const ROOT = resolve(import.meta.dirname, '../../..');
const MAX_LINES = 150;
const MAX_BYTES = 12_000;

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

function fileContextBaseline() {
  return parseFileContextBaseline(
    read('scripts/code-dojo/baselines/file-context.json'),
  );
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
  it('keeps tranche-A debt absent as later tranches lower the ceiling', () => {
    const baseline = fileContextBaseline();
    validateLiveFileContextBaseline(
      baseline,
      (path) => existsSync(resolve(ROOT, path)) ? read(path) : undefined,
    );
    const contextPaths = baseline.files.map((entry) => entry.path);
    const codeSizePaths = CODE_SIZE_BASELINE.map((entry) => entry.path);

    expect(TRANCHE_A_ROOTS).toHaveLength(5);
    expect(contextPaths.length).toBeLessThanOrEqual(32);
    expect(codeSizePaths.length).toBeLessThanOrEqual(20);
    const command = debtScript();
    expect(command).toMatch(/^tsx scripts\/code-dojo-debt\.ts --max \d+$/u);
    const ceiling = Number(command?.match(/--max (?<ceiling>\d+)$/u)?.groups?.ceiling);
    expect(Number.isSafeInteger(ceiling)).toBe(true);
    expect(ceiling).toBeLessThanOrEqual(52);
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
