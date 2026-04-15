import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

describe('WF-001 workflow adoption', () => {
  it('establishes the new planning directories and canonical workflow doc', () => {
    expect(existsSync(resolve(ROOT, 'docs/WORKFLOW.md'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'docs/method/backlog/README.md'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'docs/design/README.md'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'docs/legends/README.md'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'docs/invariants/README.md'))).toBe(true);

    const workflow = read('docs/WORKFLOW.md');
    const method = read('docs/METHOD.md');
    expect(workflow).toContain('Legends');
    expect(workflow).toContain('Cycles');
    expect(workflow).toContain('tests/cycles/<cycle>/');
    expect(workflow).toContain('docs/specs/');
    expect(workflow).toContain('cycle/<cycle_name>');
    expect(workflow).toContain('open a pull request to `main`');
    expect(method).toContain('cycle/<cycle_name>');
    expect(method).toContain('open a pull request to `main`');
  });

  it('adds explicit legend and invariant docs', () => {
    expect(existsSync(resolve(ROOT, 'docs/legends/WF-workflow-and-delivery.md'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'docs/legends/HT-humane-terminal.md'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'docs/legends/LX-localization-and-bidirectionality.md'))).toBe(true);

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
