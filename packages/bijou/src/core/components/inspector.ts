import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { renderByMode } from '../mode-render.js';
import { resolveCtx } from '../resolve-ctx.js';
import { box } from './box.js';
import type { BijouNodeOptions } from './types.js';

export type InspectorSectionTone = 'default' | 'muted';
export type InspectorChrome = 'boxed' | 'none';

/** A compact titled section within an inspector surface. */
export interface InspectorSection {
  /** Section heading shown above the content. */
  readonly title: string;
  /** Section body content. */
  readonly content: string;
  /** Optional tone for the section body. */
  readonly tone?: InspectorSectionTone;
}

/** Options for rendering a canonical inspector surface. */
export interface InspectorOptions extends BijouNodeOptions {
  /** Title shown in the box chrome or as the first plain-text line. */
  readonly title: string;
  /** Optional current selection or active value to emphasize. */
  readonly currentValue?: string;
  /** Visible label for the current value. Defaults to `Current selection`. */
  readonly currentValueLabel?: string;
  /** Optional supporting text immediately beneath the current value. */
  readonly supportingText?: string;
  /** Optional explicit label for supporting text in non-visual modes. Defaults to `Context`. */
  readonly supportingTextLabel?: string;
  /** Compact titled sections shown below the active value. */
  readonly sections?: readonly InspectorSection[];
  /** Visual chrome for rich/static rendering. Defaults to `boxed`. */
  readonly chrome?: InspectorChrome;
  /** Optional border token for the visual surface. */
  readonly borderToken?: TokenValue;
  /** Optional background token for the visual surface. */
  readonly bgToken?: TokenValue;
  /** Optional fixed width for the visual surface. */
  readonly width?: number;
  /** Bijou context for rendering mode and theme resolution. */
  readonly ctx?: BijouContext;
}

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
    contentSections.push(ctx.style.styled(muted, options.supportingText));
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
