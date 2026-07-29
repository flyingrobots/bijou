import { stringToSurface, type Surface } from '@flyingrobots/bijou';
import {
  inspectFocusMap,
  type FocusMapNode,
  type FocusMapRect,
} from './focus-map-inspection.js';

export interface FocusMapSurfaceOptions {
  readonly width?: number;
  readonly height?: number;
}

export interface FocusMapTextOptions {
  readonly includeIssues?: boolean;
}

const DEFAULT_SURFACE_WIDTH = 80;
const MIN_SURFACE_WIDTH = 1;
const MIN_SURFACE_HEIGHT = 1;
const MIN_POSITIVE_INTEGER = 1;
const EMPTY_LABEL = '-';
const FOCUSED_PREFIX = '*';
const SEP = ',';

export function focusMapText(
  nodes: readonly FocusMapNode[],
  options: FocusMapTextOptions = {},
): string {
  const report = inspectFocusMap(nodes);
  const focused =
    report.focusedNodeIds.length === 0
      ? EMPTY_LABEL
      : report.focusedNodeIds.join(SEP);
  const lines = [
    `focus map: ${String(report.nodes.length)} nodes, focused=${focused}`,
  ];

  report.nodes.forEach((node, index) => {
    lines.push(focusMapNodeLine(node, index));
  });

  if (options.includeIssues !== false && report.issues.length > 0) {
    lines.push('issues:');
    for (const issue of report.issues) {
      lines.push(`- ${issue.kind}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

export function focusMapSurface(
  nodes: readonly FocusMapNode[],
  options: FocusMapSurfaceOptions = {},
): Surface {
  const text = focusMapText(nodes);
  const lineCount = text.split('\n').length;
  const width = sanitizePositiveInteger(options.width, DEFAULT_SURFACE_WIDTH);
  const height = sanitizePositiveInteger(
    options.height,
    Math.max(MIN_SURFACE_HEIGHT, lineCount),
  );
  return stringToSurface(text, Math.max(MIN_SURFACE_WIDTH, width), height);
}

function focusMapNodeLine(node: FocusMapNode, index: number): string {
  const id = node.focused === true ? `${FOCUSED_PREFIX}${node.id}` : node.id;
  return [
    `[${String(index + 1)}]`,
    id,
    `owner=${node.owner ?? EMPTY_LABEL}`,
    `role=${node.role ?? EMPTY_LABEL}`,
    `tabIndex=${node.tabIndex === undefined ? EMPTY_LABEL : String(node.tabIndex)}`,
    `rect=${rectLabel(node.rect)}`,
    `focusable=${String(node.focusable === true)}`,
    `focused=${String(node.focused === true)}`,
    `disabled=${String(node.disabled === true)}`,
  ].join(' ');
}

function rectLabel(rect: FocusMapRect | undefined): string {
  if (rect === undefined) {
    return EMPTY_LABEL;
  }

  return `${String(rect.x)},${String(rect.y)} ${String(rect.width)}x${String(rect.height)}`;
}

function sanitizePositiveInteger(
  value: number | undefined,
  fallback: number,
): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(MIN_POSITIVE_INTEGER, Math.floor(value));
}

export { inspectFocusMap } from './focus-map-inspection.js';
export type {
  FocusMapIssue,
  FocusMapIssueKind,
  FocusMapNode,
  FocusMapRect,
  FocusMapReport,
} from './focus-map-inspection.js';
