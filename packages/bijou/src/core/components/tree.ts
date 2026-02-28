import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { resolveCtx } from '../resolve-ctx.js';

/** Represent a single node in a tree hierarchy. */
export interface TreeNode {
  /** Display text for this node. */
  label: string;
  /** Optional child nodes nested beneath this node. */
  children?: TreeNode[];
}

/** Configuration options for the {@link tree} component. */
export interface TreeOptions {
  /** Token used to style the tree guide lines and connectors. */
  guideToken?: TokenValue;
  /** Token used to style node labels. */
  labelToken?: TokenValue;
  /** Bijou context for rendering mode and theme resolution. */
  ctx?: BijouContext;
}

/**
 * Render a tree hierarchy with Unicode box-drawing connectors.
 *
 * Adapts output by mode:
 * - `pipe`: indented plain-text tree.
 * - `accessible`: indented tree with child-count annotations.
 * - `interactive`/`static`: styled Unicode connectors with themed guide lines.
 *
 * @param nodes - Top-level tree nodes to render.
 * @param options - Rendering options including guide token and context.
 * @returns The formatted tree string.
 */
export function tree(nodes: TreeNode[], options: TreeOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;

  if (mode === 'pipe') {
    return renderPlain(nodes, 0);
  }

  if (mode === 'accessible') {
    return renderAccessible(nodes, 0);
  }

  const guideToken = options.guideToken ?? ctx.theme.theme.border.muted;
  const labelToken = options.labelToken;
  return renderRich(nodes, '', true, guideToken, labelToken, ctx);
}

/**
 * Render a tree as indented plain text (pipe mode).
 *
 * @param nodes - Nodes at the current depth level.
 * @param depth - Current nesting depth (controls indentation).
 * @returns Plain-text tree string.
 */
function renderPlain(nodes: TreeNode[], depth: number): string {
  const indent = '  '.repeat(depth);
  const lines: string[] = [];
  for (const node of nodes) {
    lines.push(`${indent}${node.label}`);
    if (node.children && node.children.length > 0) {
      lines.push(renderPlain(node.children, depth + 1));
    }
  }
  return lines.join('\n');
}

/**
 * Render a tree with accessibility annotations (accessible mode).
 *
 * Parent nodes include a "(contains N items)" suffix for screen readers.
 *
 * @param nodes - Nodes at the current depth level.
 * @param depth - Current nesting depth (controls indentation).
 * @returns Accessible tree string.
 */
function renderAccessible(nodes: TreeNode[], depth: number): string {
  const indent = '  '.repeat(depth);
  const lines: string[] = [];
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      lines.push(`${indent}${node.label} (contains ${node.children.length} items)`);
      lines.push(renderAccessible(node.children, depth + 1));
    } else {
      lines.push(`${indent}${node.label}`);
    }
  }
  return lines.join('\n');
}

/**
 * Render a tree with styled Unicode box-drawing connectors (interactive/static mode).
 *
 * @param nodes - Nodes at the current depth level.
 * @param prefix - Accumulated prefix string for continuation lines.
 * @param isRoot - Whether this is the top-level invocation.
 * @param guideToken - Token used to style connectors and continuation lines.
 * @param labelToken - Optional token used to style node labels. When provided,
 *   each label is wrapped with {@link BijouContext.style.styled}; otherwise the
 *   raw label text is used.
 * @param ctx - Bijou context for styling.
 * @returns Styled tree string.
 */
function renderRich(
  nodes: TreeNode[],
  prefix: string,
  isRoot: boolean,
  guideToken: TokenValue,
  labelToken: TokenValue | undefined,
  ctx: BijouContext,
): string {
  const lines: string[] = [];
  for (const [i, node] of nodes.entries()) {
    const isLast = i === nodes.length - 1;
    const connector = isLast ? '└─ ' : '├─ ';
    const label = labelToken ? ctx.style.styled(labelToken, node.label) : node.label;

    if (isRoot) {
      lines.push(ctx.style.styled(guideToken, connector) + label);
    } else {
      lines.push(prefix + ctx.style.styled(guideToken, connector) + label);
    }

    if (node.children && node.children.length > 0) {
      const continuation = isLast ? '   ' : '│  ';
      const newPrefix = isRoot
        ? ctx.style.styled(guideToken, continuation)
        : prefix + ctx.style.styled(guideToken, continuation);
      lines.push(renderRich(node.children, newPrefix, false, guideToken, labelToken, ctx));
    }
  }
  return lines.join('\n');
}
