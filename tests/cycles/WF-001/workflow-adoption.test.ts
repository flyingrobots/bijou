import { documentationFileExists as existsSync, readDocumentationFile as readFileSync } from '../../../scripts/documentation-corpus.js';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

describe('WF-001 workflow adoption', () => {

  it('adds explicit legend and invariant docs', () => {

    const invariants = read('docs/invariants/README.md');
    expect(invariants).toContain('Tests Are the Spec');
    expect(invariants).toContain('Focus Owns Input');
    expect(invariants).toContain('Visible Controls Are a Promise');
    expect(invariants).toContain('Graceful Lowering Preserves Meaning');
    expect(invariants).toContain('Shell Owns Shell Concerns');
    expect(invariants).toContain('Docs Are the Demo');
  });

  it('captures the active workflow-adoption cycle and spinout backlog items', () => {
    const cycle = read('docs/design/WF-001-adopt-cycle-workflow.md');
    expect(cycle).toContain('Human playback');
    expect(cycle).toContain('Agent playback');
    expect(cycle).toContain('Retrospective');

    expect(existsSync(resolve(ROOT, 'docs/design/LX-001-bijou-i18n-runtime-package.md'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'docs/method/retro/WF_002-migrate-legacy-planning-artifacts.md'))).toBe(true);
  });

  it('freezes new spec-style planning work and removes the fresh i18n spec pair', () => {
    const specsReadme = read('docs/specs/README.md');
    expect(specsReadme).toContain('legacy');
    expect(specsReadme).toContain('Do **not** start new work here.');

    expect(existsSync(resolve(ROOT, 'docs/specs/bijou-i18n-runtime.spec.json'))).toBe(false);
    expect(existsSync(resolve(ROOT, 'docs/specs/bijou-i18n-tools.spec.json'))).toBe(false);
  });
});
