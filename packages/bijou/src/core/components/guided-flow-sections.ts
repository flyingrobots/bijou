import type { BijouContext } from '../../ports/context.js';
import { enumeratedList } from './enumerated-list.js';
import type {
  GuidedFlowOptions,
  GuidedFlowStep,
  GuidedFlowStepStatus,
} from './guided-flow.js';

function formatStepStatus(status: GuidedFlowStepStatus | undefined): string {
  if (status === 'complete') return 'Done';
  if (status === 'current') return 'Now';
  if (status === 'pending') return 'Next';
  return '';
}

export function formatGuidedFlowStep(step: GuidedFlowStep): string {
  const status = formatStepStatus(step.status);
  const body = step.detail ? `${step.title} - ${step.detail}` : step.title;
  return status ? `${status}: ${body}` : body;
}

function indentLines(text: string, spaces: number): string {
  const prefix = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');
}

function appendSection(lines: string[], title: string, content: string): void {
  if (!content.trim()) return;
  if (lines.length > 0) lines.push('');
  lines.push(`${title}:`, indentLines(content, 2));
}

export function buildGuidedFlowPipeSections(
  options: GuidedFlowOptions,
  context: BijouContext,
): string[] {
  const lines = [
    options.label ? `${options.label} ${options.title}` : options.title,
  ];
  if (options.metadata && options.metadata.length > 0) {
    lines.push(...options.metadata);
  }
  if (options.summary) appendSection(lines, 'Summary', options.summary);
  if (options.steps && options.steps.length > 0) {
    appendSection(
      lines,
      'Steps',
      enumeratedList(options.steps.map(formatGuidedFlowStep), {
        style: 'arabic',
        indent: 0,
        ctx: context,
      }),
    );
  }
  for (const section of options.sections ?? []) {
    appendSection(lines, section.title, section.content);
  }
  if (options.nextAction) {
    appendSection(
      lines,
      options.nextActionLabel ?? 'Next action',
      options.nextAction,
    );
  }
  return lines;
}

export function buildGuidedFlowAccessibleSections(
  options: GuidedFlowOptions,
  context: BijouContext,
): string[] {
  const lines = [
    `${options.accessibleLead ?? 'Guided flow'}: ${options.title}`,
  ];
  if (options.label && options.accessibleLead == null) {
    lines.push(`Label: ${options.label}`);
  }
  if (options.metadata && options.metadata.length > 0) {
    lines.push(...options.metadata);
  }
  if (options.summary) lines.push(`Summary: ${options.summary}`);
  if (options.steps && options.steps.length > 0) {
    lines.push(
      'Steps:',
      enumeratedList(options.steps.map(formatGuidedFlowStep), {
        style: 'arabic',
        indent: 0,
        ctx: context,
      }),
    );
  }
  for (const section of options.sections ?? []) {
    lines.push(`${section.title}: ${section.content}`);
  }
  if (options.nextAction) {
    lines.push(
      `${options.nextActionLabel ?? 'Next action'}: ${options.nextAction}`,
    );
  }
  return lines;
}
