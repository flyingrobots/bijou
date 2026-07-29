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

const UNORDERED_TAB_INDEX = Number.POSITIVE_INFINITY;
const SEP = ',';

export function inspectFocusMap(
  nodes: readonly FocusMapNode[],
): FocusMapReport {
  const orderedNodes = [...nodes].sort(compareFocusMapNodes);
  const focusedNodeIds = orderedNodes
    .filter((node) => node.focused === true)
    .map((node) => node.id);
  const issues: FocusMapIssue[] = [];

  if (
    focusedNodeIds.length === 0 &&
    orderedNodes.some((node) => node.focusable === true)
  ) {
    issues.push({
      kind: 'missing-focused',
      message: 'no focused node among focusable nodes',
    });
  }
  if (focusedNodeIds.length > 1) {
    issues.push({
      kind: 'multiple-focused',
      nodeIds: focusedNodeIds,
      message: `multiple focused nodes: ${focusedNodeIds.join(SEP)}`,
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
  issues.push(...duplicateTabIndexes(orderedNodes));
  return { nodes: orderedNodes, focusedNodeIds, issues };
}

function compareFocusMapNodes(a: FocusMapNode, b: FocusMapNode): number {
  const tabDelta = tabSortValue(a) - tabSortValue(b);
  return tabDelta !== 0 ? tabDelta : a.id.localeCompare(b.id);
}

function tabSortValue(node: FocusMapNode): number {
  return node.tabIndex ?? UNORDERED_TAB_INDEX;
}

function duplicateTabIndexes(
  nodes: readonly FocusMapNode[],
): readonly FocusMapIssue[] {
  const idsByTabIndex = new Map<number, string[]>();
  for (const node of nodes) {
    if (node.tabIndex === undefined) continue;
    const ids = idsByTabIndex.get(node.tabIndex) ?? [];
    ids.push(node.id);
    idsByTabIndex.set(node.tabIndex, ids);
  }

  const issues: FocusMapIssue[] = [];
  for (const [tabIndex, nodeIds] of idsByTabIndex) {
    if (nodeIds.length <= 1) continue;
    issues.push({
      kind: 'duplicate-tab-index',
      tabIndex,
      nodeIds,
      message: `duplicate tab index ${String(tabIndex)}: ${nodeIds.join(SEP)}`,
    });
  }
  return issues;
}
