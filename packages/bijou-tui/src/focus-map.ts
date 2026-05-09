import { stringToSurface, type Surface } from '@flyingrobots/bijou';

export interface FocusMapRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface FocusMapNode {
  readonly id: string;
  readonly owner?: string;
  readonly role?: string;
  readonly rect?: FocusMapRect;
  readonly tabIndex?: number;
  readonly focusable?: boolean;
  readonly focused?: boolean;
  readonly disabled?: boolean;
}

export type FocusMapIssueKind =
  | 'missing-focused'
  | 'multiple-focused'
  | 'focused-disabled'
  | 'duplicate-tab-index';

export interface FocusMapIssue {
  readonly kind: FocusMapIssueKind;
  readonly message: string;
  readonly nodeIds?: readonly string[];
  readonly tabIndex?: number;
}

export interface FocusMapReport {
  readonly nodes: readonly FocusMapNode[];
  readonly focusedNodeIds: readonly string[];
  readonly issues: readonly FocusMapIssue[];
}

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
const UNORDERED_TAB_INDEX = Number.POSITIVE_INFINITY;
const EMPTY_LABEL = '-';
const FOCUSED_PREFIX = '*';
const COORD_SEPARATOR = ',';
const SIZE_SEPARATOR = 'x';
const LIST_SEPARATOR = ',';

export function inspectFocusMap(nodes: readonly FocusMapNode[]): FocusMapReport {
  const orderedNodes = [...nodes].sort(compareFocusMapNodes);
  const focusedNodeIds = orderedNodes
    .filter((node) => node.focused === true)
    .map((node) => node.id);
  const issues: FocusMapIssue[] = [];

  if (focusedNodeIds.length === 0 && orderedNodes.some((node) => node.focusable === true)) {
    issues.push({
      kind: 'missing-focused',
      message: 'no focused node among focusable nodes',
    });
  }

  if (focusedNodeIds.length > 1) {
    issues.push({
      kind: 'multiple-focused',
      nodeIds: focusedNodeIds,
      message: `multiple focused nodes: ${focusedNodeIds.join(LIST_SEPARATOR)}`,
    });
  }

  for (const node of orderedNodes) {
    if (node.focused === true && node.disabled === true) {
      issues.push({
        kind: 'focused-disabled',
        nodeIds: [node.id],
        message: `focused disabled node: ${node.id}`,
      });
    }
  }

  for (const duplicate of duplicateTabIndexes(orderedNodes)) {
    issues.push(duplicate);
  }

  return {
    nodes: orderedNodes,
    focusedNodeIds,
    issues,
  };
}

export function focusMapText(
  nodes: readonly FocusMapNode[],
  options: FocusMapTextOptions = {},
): string {
  const report = inspectFocusMap(nodes);
  const focused = report.focusedNodeIds.length === 0
    ? EMPTY_LABEL
    : report.focusedNodeIds.join(LIST_SEPARATOR);
  const lines = [`focus map: ${report.nodes.length} nodes, focused=${focused}`];

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
  const height = sanitizePositiveInteger(options.height, Math.max(MIN_SURFACE_HEIGHT, lineCount));
  return stringToSurface(text, Math.max(MIN_SURFACE_WIDTH, width), height);
}

function focusMapNodeLine(node: FocusMapNode, index: number): string {
  const id = node.focused === true ? `${FOCUSED_PREFIX}${node.id}` : node.id;
  return [
    `[${index + 1}]`,
    id,
    `owner=${node.owner ?? EMPTY_LABEL}`,
    `role=${node.role ?? EMPTY_LABEL}`,
    `tabIndex=${node.tabIndex ?? EMPTY_LABEL}`,
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

  return `${rect.x}${COORD_SEPARATOR}${rect.y} ${rect.width}${SIZE_SEPARATOR}${rect.height}`;
}

function compareFocusMapNodes(a: FocusMapNode, b: FocusMapNode): number {
  const tabDelta = tabSortValue(a) - tabSortValue(b);
  if (tabDelta !== 0) {
    return tabDelta;
  }

  return a.id.localeCompare(b.id);
}

function tabSortValue(node: FocusMapNode): number {
  return node.tabIndex ?? UNORDERED_TAB_INDEX;
}

function duplicateTabIndexes(nodes: readonly FocusMapNode[]): readonly FocusMapIssue[] {
  const idsByTabIndex = new Map<number, string[]>();
  for (const node of nodes) {
    if (node.tabIndex === undefined) {
      continue;
    }

    const ids = idsByTabIndex.get(node.tabIndex) ?? [];
    ids.push(node.id);
    idsByTabIndex.set(node.tabIndex, ids);
  }

  const issues: FocusMapIssue[] = [];
  for (const [tabIndex, nodeIds] of idsByTabIndex) {
    if (nodeIds.length <= 1) {
      continue;
    }

    issues.push({
      kind: 'duplicate-tab-index',
      tabIndex,
      nodeIds,
      message: `duplicate tab index ${tabIndex}: ${nodeIds.join(LIST_SEPARATOR)}`,
    });
  }

  return issues;
}

function sanitizePositiveInteger(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(MIN_POSITIVE_INTEGER, Math.floor(value));
}
