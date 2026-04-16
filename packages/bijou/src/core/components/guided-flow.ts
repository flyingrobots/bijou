import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { renderByMode } from '../mode-render.js';
import { resolveCtx } from '../resolve-ctx.js';
import { box } from './box.js';
import { enumeratedList } from './enumerated-list.js';
import type { BijouNodeOptions } from './types.js';

export type GuidedFlowStepStatus = 'complete' | 'current' | 'pending';
export type GuidedFlowSectionTone = 'normal' | 'muted';

export interface GuidedFlowStep {
  readonly title: string;
  readonly detail?: string;
  readonly status?: GuidedFlowStepStatus;
}

export interface GuidedFlowSection {
  readonly title: string;
  readonly content: string;
  readonly tone?: GuidedFlowSectionTone;
}

export interface GuidedFlowOptions extends BijouNodeOptions {
  readonly title: string;
  readonly label?: string;
  readonly summary?: string;
  readonly metadata?: readonly string[];
  readonly steps?: readonly GuidedFlowStep[];
  readonly sections?: readonly GuidedFlowSection[];
  readonly nextAction?: string;
  readonly nextActionLabel?: string;
  readonly accessibleLead?: string;
  readonly borderToken?: TokenValue;
  readonly bgToken?: TokenValue;
  readonly width?: number;
  readonly ctx?: BijouContext;
}

function emphasizeToken(token: TokenValue): TokenValue {
  return {
    ...token,
    modifiers: [...(token.modifiers ?? []), 'bold' as const],
  };
}

function formatStepStatus(status: GuidedFlowStepStatus | undefined): string {
  if (status === 'complete') return 'Done';
  if (status === 'current') return 'Now';
  if (status === 'pending') return 'Next';
  return '';
}

function formatStep(step: GuidedFlowStep): string {
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

function buildTitleLine(options: GuidedFlowOptions): string {
  return options.label ? `${options.label} ${options.title}` : options.title;
}

function appendSection(lines: string[], title: string, content: string): void {
  if (!content.trim()) return;
  if (lines.length > 0) lines.push('');
  lines.push(`${title}:`);
  lines.push(indentLines(content, 2));
}

function buildPipeSections(options: GuidedFlowOptions, ctx: BijouContext): string[] {
  const lines: string[] = [buildTitleLine(options)];

  if (options.metadata && options.metadata.length > 0) {
    lines.push(...options.metadata);
  }

  if (options.summary) {
    appendSection(lines, 'Summary', options.summary);
  }

  if (options.steps && options.steps.length > 0) {
    appendSection(lines, 'Steps', enumeratedList(
      options.steps.map((step) => formatStep(step)),
      { style: 'arabic', indent: 0, ctx },
    ));
  }

  for (const section of options.sections ?? []) {
    appendSection(lines, section.title, section.content);
  }

  if (options.nextAction) {
    appendSection(lines, options.nextActionLabel ?? 'Next action', options.nextAction);
  }

  return lines;
}

function buildAccessibleSections(options: GuidedFlowOptions, ctx: BijouContext): string[] {
  const lines: string[] = [`${options.accessibleLead ?? 'Guided flow'}: ${options.title}`];

  if (options.label && options.accessibleLead == null) {
    lines.push(`Label: ${options.label}`);
  }

  if (options.metadata && options.metadata.length > 0) {
    lines.push(...options.metadata);
  }

  if (options.summary) {
    lines.push(`Summary: ${options.summary}`);
  }

  if (options.steps && options.steps.length > 0) {
    lines.push('Steps:');
    lines.push(enumeratedList(
      options.steps.map((step) => formatStep(step)),
      { style: 'arabic', indent: 0, ctx },
    ));
  }

  for (const section of options.sections ?? []) {
    lines.push(`${section.title}: ${section.content}`);
  }

  if (options.nextAction) {
    lines.push(`${options.nextActionLabel ?? 'Next action'}: ${options.nextAction}`);
  }

  return lines;
}

function buildInteractiveContent(options: GuidedFlowOptions, ctx: BijouContext): string {
  const primary = emphasizeToken(ctx.semantic('primary'));
  const muted = ctx.semantic('muted');
  const accent = emphasizeToken(ctx.semantic('accent'));
  const info = emphasizeToken(ctx.status('info'));
  const sections: string[] = [];

  if (options.label) {
    sections.push(`${ctx.style.styled(info, options.label)} ${ctx.style.styled(primary, options.title)}`);
  } else {
    sections.push(ctx.style.styled(primary, options.title));
  }

  if (options.metadata && options.metadata.length > 0) {
    sections.push(options.metadata.map((line) => ctx.style.styled(muted, line)).join('\n'));
  }

  if (options.summary) {
    sections.push(options.summary);
  }

  if (options.steps && options.steps.length > 0) {
    sections.push(`${ctx.style.styled(primary, 'Steps')}\n${enumeratedList(
      options.steps.map((step) => formatStep(step)),
      { style: 'arabic', indent: 2, ctx },
    )}`);
  }

  for (const section of options.sections ?? []) {
    const content = section.tone === 'muted'
      ? ctx.style.styled(muted, section.content)
      : section.content;
    sections.push(`${ctx.style.styled(primary, section.title)}\n${content}`);
  }

  if (options.nextAction) {
    sections.push(`${ctx.style.styled(accent, options.nextActionLabel ?? 'Next action')}\n${options.nextAction}`);
  }

  return sections.join('\n\n');
}

export function guidedFlow(options: GuidedFlowOptions): string {
  const ctx = resolveCtx(options.ctx);

  return renderByMode(ctx.mode, {
    pipe: () => buildPipeSections(options, ctx).join('\n'),
    accessible: () => buildAccessibleSections(options, ctx).join('\n'),
    interactive: () => box(buildInteractiveContent(options, ctx), {
      borderToken: options.borderToken ?? ctx.border('primary'),
      bgToken: options.bgToken ?? ctx.surface('elevated'),
      padding: { left: 1, right: 1 },
      width: options.width,
      ctx,
    }),
  }, options);
}
