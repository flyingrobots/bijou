import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createDogfoodStorybookWorkbenchModel } from '../../../examples/docs/storybook-workstation.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const BASELINE_PATH = 'scripts/code-dojo/baselines/file-context.json';

interface FileContextBaseline {
  readonly schema: string;
  readonly maxLines: number;
  readonly maxBytes: number;
  readonly files: readonly Readonly<{
    path: string;
    lines: number;
    bytes: number;
  }>[];
}

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function parseFileContextBaseline(source: string): FileContextBaseline {
  const parsed: unknown = JSON.parse(source);
  if (
    !isRecord(parsed) ||
    parsed.schema !== 'code-dojo.file-context-baseline.v1' ||
    typeof parsed.maxLines !== 'number' ||
    typeof parsed.maxBytes !== 'number' ||
    !Array.isArray(parsed.files)
  ) {
    throw new Error('invalid file/context baseline');
  }
  return {
    schema: parsed.schema,
    maxLines: parsed.maxLines,
    maxBytes: parsed.maxBytes,
    files: parsed.files.map((entry: unknown) => {
      if (
        !isRecord(entry) ||
        typeof entry.path !== 'string' ||
        typeof entry.lines !== 'number' ||
        typeof entry.bytes !== 'number'
      ) {
        throw new Error('invalid file/context baseline entry');
      }
      return { path: entry.path, lines: entry.lines, bytes: entry.bytes };
    }),
  };
}

describe('WF-163 Code Dojo ratchet', () => {
  it('binds the measured 112-debt ceiling to live file evidence', () => {
    const packageJson: unknown = JSON.parse(read('package.json'));
    if (!isRecord(packageJson) || !isRecord(packageJson.scripts)) {
      throw new Error('package.json scripts must be an object');
    }
    const baseline = parseFileContextBaseline(read(BASELINE_PATH));

    expect(packageJson.scripts['code-dojo:debt']).toBe(
      'tsx scripts/code-dojo-debt.ts --max 112',
    );
    expect(baseline.schema).toBe('code-dojo.file-context-baseline.v1');
    expect(baseline.files).toHaveLength(86);

    for (const entry of baseline.files) {
      expect(existsSync(resolve(ROOT, entry.path)), entry.path).toBe(true);
      const content = read(entry.path);
      const lines = content.split(/\r?\n/u).length;
      const bytes = Buffer.byteLength(content, 'utf8');
      expect({ lines, bytes }, entry.path).toEqual({ lines: entry.lines, bytes: entry.bytes });
      expect(lines > baseline.maxLines || bytes > baseline.maxBytes, entry.path)
        .toBe(true);
    }
  });

  it('records the met goalpost and the next bounded target', () => {
    const exceptions = read('docs/code-dojo-exceptions.md');
    const design = read('docs/design/WF-163-respecting-dojo-ratchet-112.md');

    expect(exceptions).toMatch(/\| File\/context baseline\s+\|\s+86\s+\|/u);
    expect(exceptions).toMatch(/\| \*\*Total\*\*\s+\|\s+\*\*112\*\*\s+\|/u);
    expect(exceptions).toContain(
      'The next met goalpost must lower the ceiling to',
    );
    expect(exceptions).toContain('`62` or lower.');
    expect(design).toContain(
      '- Removed debt: `50` of the required `50` violations',
    );
    expect(design).toContain(
      '- Next goalpost target: `62` aggregate violations or lower',
    );
  });

  it('records the complete modern-cycle ownership and review contract', () => {
    const design = read('docs/design/WF-163-respecting-dojo-ratchet-112.md');
    const requiredClaims = [
      'Legend: [WF — Workflow and Delivery](../legends/WF-workflow-and-delivery.md)',
      '## Sponsor Human',
      '## Sponsor Agent',
      '## Accessibility And Assistive Posture',
      '## Localization And Directionality Posture',
      '## Agent Inspectability And Explainability Posture',
      '## Implementation Outline',
      '## Tests To Write First',
      '## Retrospective And Closeout',
    ];

    for (const claim of requiredClaims) {
      expect(design, claim).toContain(claim);
    }
  });

  it('forbids newly created files from entering the shrinking ledger', () => {
    const design = read('docs/design/WF-163-respecting-dojo-ratchet-112.md');

    expect(design).toContain(
      '- No newly created file exceeds `150` lines or `12,000` bytes.',
    );
    expect(design).toContain(
      '- Only pre-existing baselined paths may remain in the shrinking ledger.',
    );
    expect(design).not.toContain(
      'No new file exceeds `150` lines or `12,000` bytes unless it remains in the',
    );
  });

  it('preserves distinct family grouping across slug collisions', () => {
    const [first, second] = COMPONENT_STORIES;
    if (first == null || second == null)
      throw new Error('storybook regression requires two canonical stories');
    const family = 'é';
    const model = createDogfoodStorybookWorkbenchModel([
      { ...first, id: 'localized-family-a', family },
      { ...second, id: 'localized-family-b', family },
      { ...first, id: 'ascii-family', family: '6h' },
    ]);
    expect(model.familyCount).toBe(2);
    expect(model.families.find((entry) => entry.label === family)?.stories)
      .toHaveLength(2);
  });
});
