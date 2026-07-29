import {
  type WorkflowShellStep,
  countLeadingSpaces,
  stripWrappingQuotes,
} from './workflow-shell-preflight.part01.js';
import { readYamlBlock } from './workflow-shell-preflight.part03.js';

export function parseWorkflowRunSteps(
  source: string,
  workflowPath: string,
): readonly WorkflowShellStep[] {
  const lines = source.split('\n');
  const steps: WorkflowShellStep[] = [];
  let stepsIndent: number | null = null;
  let currentStep: { lines: string[]; startLine: number } | null = null;

  const flushStep = () => {
    if (currentStep == null) return;
    const parsed = parseStepBlock(
      currentStep.lines,
      workflowPath,
      currentStep.startLine,
    );
    if (parsed != null) {
      steps.push(parsed);
    }
    currentStep = null;
  };

  for (const [index, line] of lines.entries()) {
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
export function parseStepBlock(
  stepLines: readonly string[],
  workflowPath: string,
  startLine: number,
): WorkflowShellStep | null {
  let stepName = `run@${String(startLine)}`;
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

  for (const [index, line] of stepLines.entries()) {
    const normalized = line.trimStart().replace(/^- /, '');
    if (!normalized.startsWith('run:')) continue;

    const after = normalized.slice('run:'.length).trim();
    if (after.startsWith('|') || after.startsWith('>')) {
      const script = readYamlBlock(stepLines, index, countLeadingSpaces(line));
      return { workflowPath, stepName, shell, script, line: startLine + index };
    }

    return {
      workflowPath,
      stepName,
      shell,
      script: after,
      line: startLine + index,
    };
  }

  return null;
}
