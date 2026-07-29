import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import {
  type WorkflowShellPreflightIO,
  ROOT,
  listWorkflowFiles,
  shouldValidateShell,
} from './workflow-shell-preflight.part01.js';
import { parseWorkflowRunSteps } from './workflow-shell-preflight.part02.js';
import { validateShellScript } from './workflow-shell-preflight.part03.js';

export function runWorkflowShellPreflight(
  io: WorkflowShellPreflightIO = {},
): number {
  const root = resolve(io.cwd ?? ROOT);
  const stdout = io.stdout ?? ((text: string) => process.stdout.write(text));
  const stderr = io.stderr ?? ((text: string) => process.stderr.write(text));
  const failures: string[] = [];

  for (const workflowPath of listWorkflowFiles(root)) {
    const source = readFileSync(workflowPath, 'utf8');
    const steps = parseWorkflowRunSteps(source, workflowPath).filter((step) =>
      shouldValidateShell(step.shell),
    );

    for (const step of steps) {
      stdout(
        `workflow shell ${relative(root, workflowPath)} :: ${step.stepName} ... `,
      );
      const error = validateShellScript(step.script);
      if (error == null) {
        stdout('ok\n');
        continue;
      }

      stdout('FAIL\n');
      failures.push(
        [
          `${relative(root, step.workflowPath)}:${String(step.line)} (${step.stepName})`,
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
export function main(): void {
  process.exitCode = runWorkflowShellPreflight();
}
