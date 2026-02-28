import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { getDefaultContext } from '../../context.js';

/** Represent a single collapsible section within an accordion. */
export interface AccordionSection {
  /** Section heading text. */
  title: string;
  /** Body content shown when the section is expanded. */
  content: string;
  /** Whether the section is expanded. Defaults to `false`. */
  expanded?: boolean;
}

/** Configuration options for the {@link accordion} component. */
export interface AccordionOptions {
  /** Token used to style the expand/collapse indicator arrows. */
  indicatorToken?: TokenValue;
  /** Token used to style section titles. */
  titleToken?: TokenValue;
  /** Bijou context for rendering mode and theme resolution. */
  ctx?: BijouContext;
}

/**
 * Resolve a BijouContext, falling back to the global default.
 *
 * @param ctx - Optional explicit context.
 * @returns The provided context or the global default.
 */
function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

/**
 * Render a collapsible accordion with expand/collapse indicators.
 *
 * Adapts output by mode:
 * - `pipe`: sections rendered as `# title` headings with content.
 * - `accessible`: sections tagged `[expanded]` or `[collapsed]`.
 * - `interactive`/`static`: styled `▼`/`▶` indicators with themed titles.
 *
 * @param sections - Array of accordion sections to render.
 * @param options - Rendering options including indicator/title tokens and context.
 * @returns The formatted accordion string.
 */
export function accordion(sections: AccordionSection[], options: AccordionOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;

  if (mode === 'pipe') {
    return sections
      .map((s) => `# ${s.title}\n${s.content}`)
      .join('\n\n');
  }

  if (mode === 'accessible') {
    return sections
      .map((s) => {
        if (s.expanded) {
          return `[expanded] ${s.title}: ${s.content}`;
        }
        return `[collapsed] ${s.title}`;
      })
      .join('\n');
  }

  const indicatorToken = options.indicatorToken ?? ctx.theme.theme.semantic.accent;
  const titleToken = options.titleToken ?? ctx.theme.theme.semantic.primary;

  return sections
    .map((s) => {
      if (s.expanded) {
        const indicator = ctx.style.styled(indicatorToken, '▼');
        const title = ctx.style.styled(titleToken, s.title);
        const indented = s.content
          .split('\n')
          .map((line) => `  ${line}`)
          .join('\n');
        return `${indicator} ${title}\n${indented}`;
      }
      const indicator = ctx.style.styled(indicatorToken, '▶');
      const title = ctx.style.styled(titleToken, s.title);
      return `${indicator} ${title}`;
    })
    .join('\n\n');
}
