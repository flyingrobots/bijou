import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CODE_SIZE_BASELINE } from '../../../scripts/code-size-gate.js';

const ROOT = resolve(import.meta.dirname, '../../..');
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
    !isRecord(parsed)
    || parsed.schema !== 'code-dojo.file-context-baseline.v1'
    || typeof parsed.maxLines !== 'number'
    || typeof parsed.maxBytes !== 'number'
    || !Array.isArray(parsed.files)
  ) {
    throw new Error('invalid file/context baseline');
  }
  return {
    schema: parsed.schema,
    maxLines: parsed.maxLines,
    maxBytes: parsed.maxBytes,
    files: parsed.files.map((entry: unknown) => {
      if (
        !isRecord(entry)
        || typeof entry.path !== 'string'
        || typeof entry.lines !== 'number'
        || typeof entry.bytes !== 'number'
      ) {
        throw new Error('invalid file/context baseline entry');
      }
      return { path: entry.path, lines: entry.lines, bytes: entry.bytes };
    }),
  };
}

describe('WF-164 Code Dojo ratchet', () => {
  it('binds the 62-debt goalpost to live file evidence', () => {
    const packageJson: unknown = JSON.parse(read('package.json'));
    if (!isRecord(packageJson) || !isRecord(packageJson.scripts)) {
      throw new Error('package.json scripts must be an object');
    }
    const baseline = parseFileContextBaseline(read(BASELINE_PATH));

    expect(packageJson.scripts['code-dojo:debt']).toBe(
      'tsx scripts/code-dojo-debt.ts --max 62',
    );
    expect(baseline.schema).toBe('code-dojo.file-context-baseline.v1');
    expect(baseline.files).toHaveLength(37);
    expect(CODE_SIZE_BASELINE).toHaveLength(25);

    for (const entry of baseline.files) {
      expect(existsSync(resolve(ROOT, entry.path)), entry.path).toBe(true);
      const content = read(entry.path);
      const lines = content.split(/\r?\n/u).length;
      const bytes = Buffer.byteLength(content, 'utf8');
      expect({ lines, bytes }, entry.path).toEqual({
        lines: entry.lines,
        bytes: entry.bytes,
      });
      expect(
        lines > baseline.maxLines || bytes > baseline.maxBytes,
        entry.path,
      ).toBe(true);
    }
  });

  it('records the completed goalpost and the next bounded target', () => {
    const exceptions = read('docs/code-dojo-exceptions.md');
    const design = read('docs/design/WF-164-respecting-dojo-ratchet-62.md');

    expect(exceptions).toMatch(/\| File\/context baseline\s+\|\s+37\s+\|/u);
    expect(exceptions).toMatch(/\| Code-size baseline\s+\|\s+25\s+\|/u);
    expect(exceptions).toMatch(/\| \*\*Total\*\*\s+\|\s+\*\*62\*\*\s+\|/u);
    expect(exceptions).toMatch(/`12` or lower\./u);
    expect(design).toContain(
      '- Removed combined DX-050 debt: `50` of the required `50` violations',
    );
    expect(design).toContain(
      '- Next goalpost target: `12` aggregate violations or lower',
    );
  });

  it('records the complete modern-cycle ownership and review contract', () => {
    const design = read('docs/design/WF-164-respecting-dojo-ratchet-62.md');
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
});
