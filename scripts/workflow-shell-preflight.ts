#!/usr/bin/env npx tsx

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

export interface WorkflowShellStep {
  readonly workflowPath: string;
  readonly stepName: string;
  readonly shell: string | null;
  readonly script: string;
  readonly line: number;
}

interface WorkflowShellPreflightIO {
  readonly cwd?: string;
  readonly stdout?: (text: string) => void;
  readonly stderr?: (text: string) => void;
}

function countLeadingSpaces(line: string): number {
  return line.length - line.trimStart().length;
}

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function listWorkflowFiles(root: string): readonly string[] {
  const workflowsDir = resolve(root, '.github/workflows');
  return readdirSync(workflowsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(ya?ml)$/.test(entry.name))
    .map((entry) => join(workflowsDir, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

export function sanitizeGithubExpressions(script: string): string {
  return script.replace(/\$\{\{[\s\S]*?\}\}/g, '__GITHUB_EXPR__');
}

export function shouldValidateShell(shell: string | null): boolean {
  if (shell == null || shell.trim() === '') return true;
  return shell.trim().toLowerCase().startsWith('bash');
}

export function parseWorkflowRunSteps(source: string, workflowPath: string): readonly WorkflowShellStep[] {
  const lines = source.split('\n');
  const steps: WorkflowShellStep[] = [];
  let stepsIndent: number | null = null;
  let currentStep: { lines: string[]; startLine: number } | null = null;

  const flushStep = () => {
    if (currentStep == null) return;
    const parsed = parseStepBlock(currentStep.lines, workflowPath, currentStep.startLine);
    if (parsed != null) {
      steps.push(parsed);
    }
    currentStep = null;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    const indent = countLeadingSpaces(line);

    if (stepsIndent == null) {
      if (/^\s*steps:\s*$/.test(line)) {
        stepsIndent = indent;
      }
      continue;
    }

    if (line.trim() !== '' && indent <= stepsIndent) {
      flushStep();
      stepsIndent = /^\s*steps:\s*$/.test(line) ? indent : null;
      continue;
    }

    if (line.trimStart().startsWith('- ') && indent > stepsIndent) {
      flushStep();
      currentStep = { lines: [line], startLine: index + 1 };
      continue;
    }

    if (currentStep != null) {
      currentStep.lines.push(line);
    }
  }

  flushStep();
  return steps;
}

function parseStepBlock(
  stepLines: readonly string[],
  workflowPath: string,
  startLine: number,
): WorkflowShellStep | null {
  let stepName = `run@${startLine}`;
  let shell: string | null = null;

  for (const line of stepLines) {
    const trimmed = line.trimStart().replace(/^- /, '');
    if (trimmed.startsWith('name:')) {
      stepName = stripWrappingQuotes(trimmed.slice('name:'.length));
      continue;
    }
    if (trimmed.startsWith('shell:')) {
      shell = stripWrappingQuotes(trimmed.slice('shell:'.length));
      continue;
    }
  }

  for (let index = 0; index < stepLines.length; index += 1) {
    const line = stepLines[index]!;
    const normalized = line.trimStart().replace(/^- /, '');
    if (!normalized.startsWith('run:')) continue;

    const after = normalized.slice('run:'.length).trim();
    if (after.startsWith('|') || after.startsWith('>')) {
      const script = readYamlBlock(stepLines, index, countLeadingSpaces(line));
      return { workflowPath, stepName, shell, script, line: startLine + index };
    }

    return { workflowPath, stepName, shell, script: after, line: startLine + index };
  }

  return null;
}

function readYamlBlock(stepLines: readonly string[], startIndex: number, parentIndent: number): string {
  let blockIndent: number | null = null;
  const blockLines: string[] = [];

  for (let index = startIndex + 1; index < stepLines.length; index += 1) {
    const line = stepLines[index]!;
    if (line.trim() === '') {
      if (blockIndent != null) {
        blockLines.push('');
      }
      continue;
    }

    const indent = countLeadingSpaces(line);
    if (indent <= parentIndent) {
      break;
    }

    blockIndent ??= indent;
    blockLines.push(line.slice(blockIndent));
  }

  while (blockLines.length > 0 && blockLines[blockLines.length - 1] === '') {
    blockLines.pop();
  }

  return blockLines.join('\n');
}

export function validateShellScript(script: string): string | null {
  const result = spawnSync('bash', ['-n'], {
    encoding: 'utf8',
    input: sanitizeGithubExpressions(script),
  });

  if (result.error != null) {
    return result.error.message;
  }

  if (result.status === 0) {
    return null;
  }

  return [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join('\n');
}

export function runWorkflowShellPreflight(io: WorkflowShellPreflightIO = {}): number {
  const root = resolve(io.cwd ?? ROOT);
  const stdout = io.stdout ?? ((text: string) => process.stdout.write(text));
  const stderr = io.stderr ?? ((text: string) => process.stderr.write(text));
  const failures: string[] = [];

  for (const workflowPath of listWorkflowFiles(root)) {
    const source = readFileSync(workflowPath, 'utf8');
    const steps = parseWorkflowRunSteps(source, workflowPath).filter((step) => shouldValidateShell(step.shell));

    for (const step of steps) {
      stdout(`workflow shell ${relative(root, workflowPath)} :: ${step.stepName} ... `);
      const error = validateShellScript(step.script);
      if (error == null) {
        stdout('ok\n');
        continue;
      }

      stdout('FAIL\n');
      failures.push(
        [
          `${relative(root, step.workflowPath)}:${step.line} (${step.stepName})`,
          error,
          step.script,
        ].join('\n'),
      );
    }
  }

  if (failures.length > 0) {
    stderr('\nWorkflow shell preflight failures:\n');
    for (const failure of failures) {
      stderr(`${failure}\n\n`);
    }
    return 1;
  }

  return 0;
}

function main(): void {
  process.exitCode = runWorkflowShellPreflight();
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
