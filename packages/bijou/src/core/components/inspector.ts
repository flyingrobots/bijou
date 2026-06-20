import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { renderByMode } from '../mode-render.js';
import { resolveCtx } from '../resolve-ctx.js';
import { box } from './box.js';
import type { InspectorOptions, InspectorSection } from './inspector-types.js';

export type {
  InspectorChrome,
  InspectorOptions,
  InspectorSection,
  InspectorSectionTone,
} from './inspector-types.js';

function emphasizeToken(token: TokenValue): TokenValue {
  return {
    ...token,
    modifiers: [...(token.modifiers ?? []), 'bold' as const],
  };
}

function nonEmptySections(options: InspectorOptions): readonly InspectorSection[] {
  return (options.sections ?? []).filter((section) => section.content.trim().length > 0);
}

function indentLines(content: string, spaces = 2): string {
  const indent = ' '.repeat(Math.max(0, spaces));
  return content
    .split('\n')
    .map((line) => `${indent}${line}`)
    .join('\n');
}

function formatInlineOrBlock(title: string, content: string): string[] {
  if (!content.includes('\n')) {
    return [`${title}: ${content}`];
  }
  return [`${title}:`, indentLines(content)];
}

function buildPipeSections(options: InspectorOptions): string[] {
  const lines: string[] = [options.title];
  const currentValueLabel = options.currentValueLabel ?? 'Current selection';
  const supportingTextLabel = options.supportingTextLabel ?? 'Context';

  if (options.currentValue) {
    lines.push('');
    lines.push(`${currentValueLabel}: ${options.currentValue}`);
  }

  if (options.supportingText) {
    lines.push('');
    lines.push(...formatInlineOrBlock(supportingTextLabel, options.supportingText));
  }

  for (const section of nonEmptySections(options)) {
    lines.push('');
    lines.push(`${section.title}:`);
    lines.push(indentLines(section.content));
  }

  return lines;
}

function buildAccessibleSections(options: InspectorOptions): string[] {
  const lines: string[] = [`Inspector: ${options.title}`];
  const currentValueLabel = options.currentValueLabel ?? 'Current selection';
  const supportingTextLabel = options.supportingTextLabel ?? 'Context';

  if (options.currentValue) {
    lines.push(`${currentValueLabel}: ${options.currentValue}`);
  }

  if (options.supportingText) {
    lines.push(...formatInlineOrBlock(supportingTextLabel, options.supportingText));
  }

  for (const section of nonEmptySections(options)) {
    lines.push(...formatInlineOrBlock(section.title, section.content));
  }

  return lines;
}

function buildInteractiveContent(options: InspectorOptions, ctx: BijouContext): string {
  const primary = emphasizeToken(ctx.semantic('primary'));
  const muted = ctx.semantic('muted');
  const currentValueLabel = options.currentValueLabel ?? 'Current selection';
  const contentSections: string[] = [];

  if (options.currentValue) {
    contentSections.push(`${ctx.style.styled(muted, currentValueLabel)}\n${ctx.style.styled(primary, options.currentValue)}`);
  }

  if (options.supportingText) {
    const stLabel = options.supportingTextLabel ?? 'Context';
    contentSections.push(`${ctx.style.styled(muted, stLabel)}\n${ctx.style.styled(muted, options.supportingText)}`);
  }

  for (const section of nonEmptySections(options)) {
    const body = section.tone === 'muted'
      ? ctx.style.styled(muted, section.content)
      : section.content;
    contentSections.push(`${ctx.style.styled(primary, section.title)}\n${body}`);
  }

  return contentSections.join('\n\n');
}

/**
 * Render a canonical inspector surface for compact side-panel context.
 *
 * Output adapts by mode:
 * - `interactive` / `static`: boxed current-selection panel with compact titled sections by default, or plain sectioned content when `chrome: 'none'`.
 * - `pipe`: plain grouped text with explicit field labels.
 * - `accessible`: explicit linearized field/value output with the same meaning.
 */
export function inspector(options: InspectorOptions): string {
  const ctx = resolveCtx(options.ctx);

  return renderByMode(ctx.mode, {
    pipe: () => buildPipeSections(options).join('\n'),
    accessible: () => buildAccessibleSections(options).join('\n'),
    interactive: () => {
      const content = buildInteractiveContent(options, ctx);
      if (options.chrome === 'none') return content;
      return box(content, {
        title: options.title,
        borderToken: options.borderToken ?? ctx.border('muted'),
        bgToken: options.bgToken ?? ctx.surface('elevated'),
        padding: { left: 1, right: 1 },
        width: options.width,
        ctx,
      });
    },
  }, options);
}
