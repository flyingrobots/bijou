import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  parseWorkflowRunSteps,
  runWorkflowShellPreflight,
  sanitizeGithubExpressions,
  validateShellScript,
} from './workflow-shell-preflight.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('parseWorkflowRunSteps', () => {
  it('extracts single-line and multiline run steps from workflow YAML', () => {
    const steps = parseWorkflowRunSteps(`
jobs:
  test:
    steps:
      - name: Install
        run: npm ci
      - name: Generate
        shell: bash
        run: |
          set -euo pipefail
          echo "\${{ github.sha }}"
`, '/tmp/workflow.yml');

    expect(steps).toEqual([
      {
        workflowPath: '/tmp/workflow.yml',
        stepName: 'Install',
        shell: null,
        script: 'npm ci',
        line: 6,
      },
      {
        workflowPath: '/tmp/workflow.yml',
        stepName: 'Generate',
        shell: 'bash',
        script: 'set -euo pipefail\necho "${{ github.sha }}"',
        line: 9,
      },
    ]);
  });
});

describe('sanitizeGithubExpressions', () => {
  it('replaces GitHub expression syntax with shell-safe placeholders', () => {
    expect(sanitizeGithubExpressions('echo "${{ github.sha }}"')).toBe('echo "__GITHUB_EXPR__"');
  });
});

describe('validateShellScript', () => {
  it('accepts scripts that only contain GitHub expressions once sanitized', () => {
    expect(validateShellScript('echo "${{ github.sha }}"')).toBeNull();
  });

  it('reports malformed shell', () => {
    expect(validateShellScript('if true; then\necho ok')).toBeTruthy();
  });
});

describe('runWorkflowShellPreflight', () => {
  it('validates the shipped workflow shell blocks', () => {
    const output: string[] = [];
    const status = runWorkflowShellPreflight({
      cwd: ROOT,
      stdout: (text) => output.push(text),
      stderr: (text) => output.push(text),
    });

    expect(status).toBe(0);
    expect(output.join('')).toContain('workflow shell .github/workflows/publish.yml');
    expect(output.join('')).toContain('workflow shell .github/workflows/release-dry-run.yml');
  });

  it('anchors GitHub release commands to an explicit repository context', () => {
    const publishWorkflow = readFileSync(resolve(ROOT, '.github/workflows/publish.yml'), 'utf8');

    expect(publishWorkflow).toContain('github_release:');
    expect(publishWorkflow).toContain('ref: ${{ needs.verify.outputs.release_sha }}');
    expect(publishWorkflow).toContain('gh release view "$TAG" --repo "$REPO"');
    expect(publishWorkflow).toContain('gh release edit "$TAG" \\');
    expect(publishWorkflow).toContain('--repo "$REPO" \\');
    expect(publishWorkflow).toContain('gh release create "$TAG" \\');
  });
});
