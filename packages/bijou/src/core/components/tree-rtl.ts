import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import type { TreeNode } from './tree.js';
import { alignEnd } from './rtl-align.js';

/** Explicit mirror pairs for tree connector glyphs; `│` and `─` map to themselves. */
const TREE_GLYPHS: ReadonlyMap<string, string> = new Map([
  ['├', '┤'], ['┤', '├'], ['└', '┘'], ['┘', '└'], ['┌', '┐'], ['┐', '┌'], ['│', '│'], ['─', '─'],
]);

/**
 * Mirror a tree connector segment for right-to-left layout: reverse the
 * characters, then swap each connector glyph for its opposite. ASCII
 * fallbacks (`|`, `-`, `` ` ``) are only reversed. Component-owned glyphs
 * only; never pass a label.
 */
export function mirrorTreeGlyphs(text: string): string {
  return Array.from(text).reverse().map((glyph) => TREE_GLYPHS.get(glyph) ?? glyph).join('');
}

function rows(
  nodes: TreeNode[],
  prefix: string,
  guide: TokenValue,
  labelToken: TokenValue | undefined,
  ctx: BijouContext,
): string[] {
  const lines: string[] = [];
  for (const [i, node] of nodes.entries()) {
    const isLast = i === nodes.length - 1;
    const label = labelToken ? ctx.style.styled(labelToken, node.label) : node.label;
    lines.push(label + ctx.style.styled(guide, mirrorTreeGlyphs(isLast ? '└─ ' : '├─ ')) + prefix);
    if (node.children && node.children.length > 0) {
      const continuation = ctx.style.styled(guide, mirrorTreeGlyphs(isLast ? '   ' : '│  '));
      lines.push(...rows(node.children, continuation + prefix, guide, labelToken, ctx));
    }
  }
  return lines;
}

/** Render a tree for right-to-left layout, right-aligned to its widest line. */
export function renderRichRtl(
  nodes: TreeNode[],
  guide: TokenValue,
  labelToken: TokenValue | undefined,
  ctx: BijouContext,
): string {
  return alignEnd(rows(nodes, '', guide, labelToken, ctx));
}
