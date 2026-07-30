import {
  graphemeWidth,
  segmentGraphemes,
} from '../text/grapheme.js';
import type { DagCompactShape } from './dag.js';
import type {
  DagCharType,
  DagNodeBox,
} from './dag-render-contract.js';
import {
  centeredRun,
  compactDelimiters,
  truncateLabel,
  visibleLength,
} from './dag-render-metrics.js';

function centeredLabelAndBadge(
  label: string,
  badge: string | undefined,
  width: number,
): { content: string; types: DagCharType[] } {
  if (badge == null) return centeredRun(label, width, 'label');
  const truncated = truncateLabel(
    label,
    Math.max(1, width - visibleLength(badge) - 1),
  );
  const combined = `${truncated} ${badge}`;
  const remaining = Math.max(0, width - visibleLength(combined));
  const left = Math.floor(remaining / 2);
  const right = remaining - left;
  return {
    content: ' '.repeat(left) + combined + ' '.repeat(right),
    types: [
      ...Array.from({ length: left }, (): DagCharType => 'pad'),
      ...segmentGraphemes(truncated).map((): DagCharType => 'label'),
      'pad',
      ...segmentGraphemes(badge).map((): DagCharType => 'badge'),
      ...Array.from({ length: right }, (): DagCharType => 'pad'),
    ],
  };
}

export function renderNodeBox(
  label: string,
  badge: string | undefined,
  width: number,
  ghost: boolean,
): DagNodeBox {
  const horizontal = ghost ? '\u254c' : '\u2500';
  const vertical = ghost ? '\u254e' : '\u2502';
  const innerWidth = width - 2;
  const centered = centeredLabelAndBadge(label, badge, innerWidth - 2);
  const border = Array.from(
    { length: width },
    (): DagCharType => 'border',
  );
  return {
    lines: [
      `\u256d${horizontal.repeat(innerWidth)}\u256e`,
      `${vertical} ${centered.content} ${vertical}`,
      `\u2570${horizontal.repeat(innerWidth)}\u256f`,
    ],
    charTypes: [
      border,
      ['border', 'pad', ...centered.types, 'pad', 'border'],
      border,
    ],
    height: 3,
    width,
  };
}

export function renderCompactNode(
  label: string,
  badge: string | undefined,
  width: number,
  shape: DagCompactShape,
): DagNodeBox {
  const { open, close } = compactDelimiters(shape);
  const centered = centeredLabelAndBadge(
    label,
    badge,
    Math.max(1, width - visibleLength(open) - visibleLength(close)),
  );
  return {
    lines: [open + centered.content + close],
    charTypes: [[
      ...segmentGraphemes(open).map((): DagCharType => 'border'),
      ...centered.types,
      ...segmentGraphemes(close).map((): DagCharType => 'border'),
    ]],
    height: 1,
    width,
  };
}

export function expandToColumns(
  graphemes: string[],
  types: DagCharType[],
): { chars: string[]; types: DagCharType[] } {
  const chars: string[] = [];
  const expandedTypes: DagCharType[] = [];
  for (const [index, grapheme] of graphemes.entries()) {
    const type = types[index] ?? 'pad';
    chars.push(grapheme);
    expandedTypes.push(type);
    if (graphemeWidth(grapheme) === 2) {
      chars.push('');
      expandedTypes.push(type);
    }
  }
  return { chars, types: expandedTypes };
}
