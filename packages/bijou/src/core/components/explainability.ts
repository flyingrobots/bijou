import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { resolveCtx } from '../resolve-ctx.js';
import { enumeratedList } from './enumerated-list.js';
import { guidedFlow, type GuidedFlowSection } from './guided-flow.js';
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

function buildExplainabilitySections(options: ExplainabilityOptions, ctx: BijouContext): GuidedFlowSection[] {
  const sections: GuidedFlowSection[] = [];

  if (options.rationale) {
    sections.push({ title: 'Why', content: options.rationale });
  }

  if (options.evidence && options.evidence.length > 0) {
    sections.push({
      title: 'Evidence',
      content: enumeratedList(
        options.evidence.map((item) => formatEvidenceItem(item)),
        {
          style: ctx.mode === 'interactive' ? 'bullet' : 'arabic',
          indent: ctx.mode === 'interactive' ? 2 : 0,
          ctx,
        },
      ),
    });
  }

  if (options.governance) {
    sections.push({
      title: 'Governance',
      content: options.governance,
      tone: 'muted',
    });
  }

  return sections;
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
  return guidedFlow({
    title: options.title,
    label: options.label ?? '[AI]',
    accessibleLead: 'AI explanation',
    metadata: buildMetadataLines(options),
    sections: buildExplainabilitySections(options, ctx),
    nextAction: options.nextAction,
    borderToken: options.borderToken ?? ctx.border('primary'),
    bgToken: options.bgToken ?? ctx.surface('elevated'),
    width: options.width,
    ctx,
  });
}
