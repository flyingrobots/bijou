import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

function normalizeWhitespace(source: string): string {
  return source.replace(/\s+/g, ' ').trim();
}

function sectionBetween(source: string, startHeading: string, endHeading: string): string {
  const start = source.indexOf(startHeading);
  if (start === -1) throw new Error(`Missing start heading ${startHeading}`);
  const end = source.indexOf(endHeading, start + startHeading.length);
  if (end === -1) throw new Error(`Missing end heading ${endHeading}`);
  return source.slice(start, end);
}

describe('WF-130 roadmap goalpost policy', () => {
  it('links the #458 VISOR artifact bundle cycle to DX-049', () => {
    const designPath = 'docs/design/DX-049-visor-artifact-bundle-proof.md';
    const roadmap = normalizeWhitespace(read('docs/ROADMAP.md'));
    const bearing = normalizeWhitespace(read('docs/BEARING.md'));
    const designSource = read(designPath);
    const design = normalizeWhitespace(designSource);
    const nonGoals = normalizeWhitespace(sectionBetween(designSource, '## Non-Goals', '## Bundle Contract'));

    expect(existsSync(resolve(ROOT, designPath))).toBe(true);
    expect(roadmap).toContain('[`DX-049`](./design/DX-049-visor-artifact-bundle-proof.md)');
    expect(roadmap).toContain('`visor-artifact-bundle/1` proof');
    expect(bearing).toContain('The #458 cycle design is [DX-049](./design/DX-049-visor-artifact-bundle-proof.md)');
    expect(design).toContain('User story: [#458](https://github.com/flyingrobots/bijou/issues/458)');
    expect(design).toContain('V8 tracker: [#457](https://github.com/flyingrobots/bijou/issues/457)');
    expect(design).toContain('`visor-artifact-bundle/1`');
    expect(design).toContain('`bijou-block/1`');
    expect(design).toContain('`ui-scene-ir/1`');
    expect(design).toContain('replay metadata');
    expect(design).toContain('visual scene facts');
    expect(design).toContain('Tests To Write First');
    expect(nonGoals).toContain('implement #459 packed-cell-to-`Surface` validation');
  });
});
