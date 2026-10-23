import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { parseWorkflowRunSteps } from './workflow-shell-preflight.js';

const workflowPath = resolve(import.meta.dirname, '../.github/workflows/release-dry-run.yml');
const workflow = readFileSync(workflowPath, 'utf8');

function checkOutputs(version: string | undefined, notesTag: string | undefined) {
  const step = parseWorkflowRunSteps(workflow, workflowPath)
    .find(({ stepName }) => stepName === 'Validate dry-run metadata');
  if (step === undefined) throw new Error('Release Dry Run has no metadata output guard');
  const env = { ...process.env };
  delete env['BIJOU_RELEASE_VERSION'];
  delete env['BIJOU_RELEASE_NOTES_TAG'];
  if (version !== undefined) env['BIJOU_RELEASE_VERSION'] = version;
  if (notesTag !== undefined) env['BIJOU_RELEASE_NOTES_TAG'] = notesTag;
  return spawnSync('bash', ['-euo', 'pipefail', '-c', step.script], { env, encoding: 'utf8', timeout: 5_000 });
}

describe('Release Dry Run metadata output guard', () => {
  it('accepts outputs produced by the real metadata entrypoint', () => {
    const root = resolve(import.meta.dirname, '..');
    const scratch = mkdtempSync(join(tmpdir(), 'bijou-release-output-'));
    try {
      const path = join(scratch, 'github-output');
      const computed = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/release-metadata.ts',
        '--current-version', '--notes-tag-run-id', '123', '--github-output', path], {
        cwd: root, encoding: 'utf8', timeout: 15_000,
      });
      expect(computed.status, computed.stdout + computed.stderr).toBe(0);
      const outputs = new Map(readFileSync(path, 'utf8').trim().split('\n').map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)] as const;
      }));
      expect(outputs.get('version')).toBeTruthy();
      expect(outputs.get('notes_tag')).toBeTruthy();
      const result = checkOutputs(outputs.get('version'), outputs.get('notes_tag'));
      expect(result.status, result.stdout + result.stderr).toBe(0);
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  });

  it.each(['8.0.0', '8.0.0-rc.1'])('accepts populated outputs for %s', (version) => {
    const result = checkOutputs(version, `v${version}-dry-run-123`);
    expect(result.status, result.stdout + result.stderr).toBe(0);
  });

  it.each([undefined, '', ' \t\n'])('rejects missing or blank version: %s', (version) => {
    const result = checkOutputs(version, 'v8.0.0-dry-run-123');
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('::error::Release metadata output version is empty');
  });

  it.each([undefined, '', ' \t\n'])('rejects missing or blank notes tag: %s', (tag) => {
    const result = checkOutputs('8.0.0', tag);
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('::error::Release metadata output notes_tag is empty');
  });
});
