import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { renderByMode } from '../mode-render.js';
import { resolveCtx } from '../resolve-ctx.js';
import { box } from './box.js';
import { enumeratedList } from './enumerated-list.js';
import type { BijouNodeOptions } from './types.js';

/** A single evidence item supporting an explainability recommendation. */
export interface ExplainabilityEvidenceItem {
  /** Primary evidence statement. */
  readonly label: string;
  /** Optional supporting detail for the evidence item. */
  readonly detail?: string;
}

/** Options for rendering a canonical explainability surface. */
export interface ExplainabilityOptions extends BijouNodeOptions {
  /** Primary recommendation or explanation title. */
  readonly title: string;
  /** Visible provenance label. Defaults to `[AI]`. */
  readonly label?: string;
  /** Optional artifact kind, such as `Suggestion` or `Summary`. */
  readonly artifactKind?: string;
  /** Optional source or actor responsible for the recommendation. */
  readonly source?: string;
  /** Optional source mode, such as `advisory` or `draft`. */
  readonly sourceMode?: string;
  /** Optional rationale describing why the recommendation is present. */
  readonly rationale?: string;
  /** Optional evidence items supporting the recommendation. */
  readonly evidence?: readonly ExplainabilityEvidenceItem[];
  /** Optional clear next action for the user. */
  readonly nextAction?: string;
  /** Optional governance or review note. */
  readonly governance?: string;
  /** Optional confidence. Numbers are formatted as percentages. */
  readonly confidence?: number | string;
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

function formatConfidence(confidence: number | string | undefined): string | undefined {
  if (confidence == null) return undefined;
  if (typeof confidence === 'string') return confidence;
  if (Number.isNaN(confidence)) return undefined;
  const percentage = confidence >= 0 && confidence <= 1 ? confidence * 100 : confidence;
  return `${Math.round(percentage)}%`;
}

function formatEvidenceItem(item: ExplainabilityEvidenceItem): string {
  return item.detail ? `${item.label} — ${item.detail}` : item.label;
}

function buildMetadataLines(options: ExplainabilityOptions): string[] {
  const lines: string[] = [];
  if (options.artifactKind) lines.push(`Artifact kind: ${options.artifactKind}`);
  if (options.source) lines.push(`Source: ${options.source}`);
  if (options.sourceMode) lines.push(`Source mode: ${options.sourceMode}`);
  const confidence = formatConfidence(options.confidence);
  if (confidence) lines.push(`Confidence: ${confidence}`);
  return lines;
}

function buildPipeSections(options: ExplainabilityOptions): string[] {
  const lines: string[] = [];

  lines.push(`${options.label ?? '[AI]'} ${options.title}`);
  lines.push(...buildMetadataLines(options));

  if (options.rationale) {
    if (lines.length > 0) lines.push('');
    lines.push('Why:');
    lines.push(`  ${options.rationale}`);
  }

  if (options.evidence && options.evidence.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('Evidence:');
    lines.push(...options.evidence.map((item) => `- ${formatEvidenceItem(item)}`));
  }

  if (options.nextAction) {
    if (lines.length > 0) lines.push('');
    lines.push('Next action:');
    lines.push(`  ${options.nextAction}`);
  }

  if (options.governance) {
    if (lines.length > 0) lines.push('');
    lines.push('Governance:');
    lines.push(`  ${options.governance}`);
  }

  return lines;
}

function buildAccessibleSections(options: ExplainabilityOptions): string[] {
  const lines: string[] = [`AI explanation: ${options.title}`];
  lines.push(...buildMetadataLines(options));

  if (options.rationale) {
    lines.push(`Why: ${options.rationale}`);
  }

  if (options.evidence && options.evidence.length > 0) {
    lines.push('Evidence:');
    lines.push(enumeratedList(
      options.evidence.map((item) => formatEvidenceItem(item)),
      { style: 'arabic', indent: 0 },
    ));
  }

  if (options.nextAction) {
    lines.push(`Next action: ${options.nextAction}`);
  }

  if (options.governance) {
    lines.push(`Governance: ${options.governance}`);
  }

  return lines;
}

function buildInteractiveContent(options: ExplainabilityOptions, ctx: BijouContext): string {
  const primary = ctx.semantic('primary');
  const strong = emphasizeToken(primary);
  const muted = ctx.semantic('muted');
  const info = emphasizeToken(ctx.status('info'));
  const label = options.label ?? '[AI]';

  const sections: string[] = [
    `${ctx.style.styled(info, label)} ${ctx.style.styled(strong, options.title)}`,
  ];

  const metadata = buildMetadataLines(options);
  if (metadata.length > 0) {
    sections.push(metadata.map((line) => ctx.style.styled(muted, line)).join('\n'));
  }

  if (options.rationale) {
    sections.push(`${ctx.style.styled(strong, 'Why')}\n${options.rationale}`);
  }

  if (options.evidence && options.evidence.length > 0) {
    sections.push(`${ctx.style.styled(strong, 'Evidence')}\n${enumeratedList(
      options.evidence.map((item) => formatEvidenceItem(item)),
      { style: 'bullet', indent: 2, ctx },
    )}`);
  }

  if (options.nextAction) {
    sections.push(`${ctx.style.styled(strong, 'Next action')}\n${options.nextAction}`);
  }

  if (options.governance) {
    sections.push(`${ctx.style.styled(strong, 'Governance')}\n${ctx.style.styled(muted, options.governance)}`);
  }

  return sections.join('\n\n');
}

/**
 * Render a canonical explainability surface for AI-mediated recommendations.
 *
 * Output adapts by mode:
 * - `interactive` / `static`: boxed, sectioned explainability surface with a visible `[AI]` label.
 * - `pipe`: plain, newline-separated labeled sections.
 * - `accessible`: explicit linearized explanation with the same meaning.
 */
export function explainability(options: ExplainabilityOptions): string {
  const ctx = resolveCtx(options.ctx);

  return renderByMode(ctx.mode, {
    pipe: () => buildPipeSections(options).join('\n'),
    accessible: () => buildAccessibleSections(options).join('\n'),
    interactive: () => box(buildInteractiveContent(options, ctx), {
      borderToken: options.borderToken ?? ctx.border('primary'),
      bgToken: options.bgToken ?? ctx.surface('elevated'),
      padding: { left: 1, right: 1 },
      width: options.width,
      ctx,
    }),
  }, options);
}
