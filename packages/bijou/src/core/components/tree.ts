import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { getDefaultContext } from '../../context.js';

export interface TreeNode {
  label: string;
  children?: TreeNode[];
}

export interface TreeOptions {
  guideToken?: TokenValue;
  labelToken?: TokenValue;
  ctx?: BijouContext;
}

function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

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
  return renderRich(nodes, '', true, guideToken, ctx);
}

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

function renderRich(
  nodes: TreeNode[],
  prefix: string,
  isRoot: boolean,
  guideToken: TokenValue,
  ctx: BijouContext,
): string {
  const lines: string[] = [];
  for (const [i, node] of nodes.entries()) {
    const isLast = i === nodes.length - 1;
    const connector = isLast ? '└─ ' : '├─ ';

    if (isRoot) {
      lines.push(ctx.style.styled(guideToken, connector) + node.label);
    } else {
      lines.push(prefix + ctx.style.styled(guideToken, connector) + node.label);
    }

    if (node.children && node.children.length > 0) {
      const continuation = isLast ? '   ' : '│  ';
      const newPrefix = isRoot
        ? ctx.style.styled(guideToken, continuation)
        : prefix + ctx.style.styled(guideToken, continuation);
      lines.push(renderRich(node.children, newPrefix, false, guideToken, ctx));
    }
  }
  return lines.join('\n');
}
