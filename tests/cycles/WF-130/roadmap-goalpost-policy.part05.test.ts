import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  expectClaims,
  normalized,
  read,
  requireRecord,
  ROOT,
  sectionBetween,
} from './roadmap-goalpost-policy.test-support.js';

describe('WF-130 roadmap documentation contracts', () => {
  it('disables Markdown line-length linting for project docs', () => {
    const config = requireRecord(JSON.parse(read('.markdownlint.json')));
    expect(config.MD013).toBe(false);
    expect(config['line-length']).toBe(false);
  });

  it('publishes discoverable v7.2 release docs for the versioned package set', () => {
    for (const path of [
      'docs/releases/7.2.0/README.md',
      'docs/releases/7.2.0/whats-new.md',
      'docs/releases/7.2.0/migration-guide.md',
    ]) {
      expect(existsSync(resolve(ROOT, path)), path).toBe(true);
    }
    expectClaims(read('docs/releases/README.md'), [
      '[Release Evidence (v7.2.0)](./7.2.0/README.md)',
      "[What's New (v7.2.0)](./7.2.0/whats-new.md)",
      '[Migration Guide (v7.2.0)](./7.2.0/migration-guide.md)',
    ]);
  });

  it('links the #458 VISOR artifact bundle cycle to DX-049', () => {
    const path = 'docs/design/DX-049-visor-artifact-bundle-proof.md';
    const source = read(path);
    expect(existsSync(resolve(ROOT, path))).toBe(true);
    expectClaims(normalized('docs/ROADMAP.md'), [
      '[`DX-049`](./design/DX-049-visor-artifact-bundle-proof.md)',
      '`visor-artifact-bundle/1` proof',
    ]);
    expectClaims(normalized('docs/BEARING.md'), [
      'Their cycle designs remain [DX-049](./design/DX-049-visor-artifact-bundle-proof.md)',
    ]);
    expectClaims(normalizeSource(source), [
      'User story: [#458](https://github.com/flyingrobots/bijou/issues/458)',
      'V8 tracker: [#457](https://github.com/flyingrobots/bijou/issues/457)',
      '`visor-artifact-bundle/1`',
      '`bijou-block/1`',
      '`ui-scene-ir/1`',
      'replay metadata',
      'visual scene facts',
      'Tests To Write First',
    ]);
    expect(
      sectionBetween(source, '## Non-Goals', '## Bundle Contract'),
    ).toContain('implement #459 packed-cell-to-`Surface` validation');
  });
});

function normalizeSource(source: string): string {
  return source.replace(/\s+/g, ' ').trim();
}
