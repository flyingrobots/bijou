import type { TokenValue } from '../theme/tokens.js';
import {
  graphemeWidth,
  segmentGraphemes,
  stripAnsi,
} from '../text/grapheme.js';
import type {
  DagCompactShape,
  DagNode,
  DagNodeStyle,
} from './dag.js';
import type { DagCharType } from './dag-render-contract.js';

export function visibleLength(value: string): number {
  return graphemeWidth(value);
}

export function truncateLabel(text: string, maxLength: number): string {
  if (maxLength <= 0) return '';
  if (visibleLength(text) <= maxLength) return text;
  let width = 0;
  let result = '';
  for (const grapheme of segmentGraphemes(stripAnsi(text))) {
    const nextWidth = graphemeWidth(grapheme);
    if (width + nextWidth > maxLength - 1) break;
    result += grapheme;
    width += nextWidth;
  }
  return `${result}\u2026`;
}

export function preferredColumnGap(nodeWidth: number): number {
  if (nodeWidth <= 5) return 1;
  if (nodeWidth <= 9) return 2;
  if (nodeWidth <= 13) return 3;
  return 4;
}

export function nodeHeightForStyle(style: DagNodeStyle): number {
  return style === 'compact' ? 1 : 3;
}

export function rowStrideForStyle(style: DagNodeStyle): number {
  return style === 'compact' ? 4 : 6;
}

export function minimumNodeWidth(style: DagNodeStyle): number {
  return style === 'compact' ? 3 : 5;
}

export function automaticNodeWidthFloor(style: DagNodeStyle): number {
  return style === 'compact' ? 3 : 16;
}

export function minimumDetourWidth(
  nodes: readonly DagNode[],
  layerMap: ReadonlyMap<string, number>,
  columnIndex: ReadonlyMap<string, number>,
  layerWidths: readonly number[],
  nodeWidth: number,
): number {
  const detour = Math.floor(nodeWidth / 2) + 1;
  let required = 0;
  for (const node of nodes) {
    const fromLayer = layerMap.get(node.id);
    const fromColumn = columnIndex.get(node.id);
    if (fromLayer == null || fromColumn == null) continue;
    for (const childId of node.edges ?? []) {
      const toLayer = layerMap.get(childId);
      const toColumn = columnIndex.get(childId);
      if (
        toLayer == null
        || toColumn == null
        || fromColumn === toColumn
        || toLayer - fromLayer <= 1
      ) continue;
      required = Math.max(
        required,
        (layerWidths[fromLayer] ?? 0) + detour * 2,
        (layerWidths[toLayer] ?? 0) + detour * 2,
      );
    }
  }
  return required;
}

export function compactDelimiters(
  shape: DagCompactShape,
): { open: string; close: string } {
  switch (shape) {
    case 'round': return { open: '(', close: ')' };
    case 'angle': return { open: '<', close: '>' };
    case 'brace': return { open: '{', close: '}' };
    case 'plain': return { open: '', close: '' };
    case 'square': return { open: '[', close: ']' };
  }
}

export function withBackground(
  token: TokenValue,
  background?: TokenValue,
): TokenValue {
  return background?.bg == null
    ? token
    : {
      ...token,
      bg: background.bg,
      bgRGB: background.bgRGB ?? token.bgRGB,
    };
}

export function centeredRun(
  label: string,
  width: number,
  type: DagCharType,
): { content: string; types: DagCharType[] } {
  const text = truncateLabel(label, width);
  const remaining = Math.max(0, width - visibleLength(text));
  const left = Math.floor(remaining / 2);
  const right = remaining - left;
  return {
    content: ' '.repeat(left) + text + ' '.repeat(right),
    types: [
      ...Array.from({ length: left }, (): DagCharType => 'pad'),
      ...segmentGraphemes(text).map(() => type),
      ...Array.from({ length: right }, (): DagCharType => 'pad'),
    ],
  };
}
