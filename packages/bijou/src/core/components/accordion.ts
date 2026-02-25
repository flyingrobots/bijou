import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { getDefaultContext } from '../../context.js';

export interface AccordionSection {
  title: string;
  content: string;
  expanded?: boolean;
}

export interface AccordionOptions {
  indicatorToken?: TokenValue;
  titleToken?: TokenValue;
  ctx?: BijouContext;
}

function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

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
