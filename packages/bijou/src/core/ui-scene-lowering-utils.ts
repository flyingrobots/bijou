import type { Cell } from '../ports/surface.js';
import type { UiNode } from './ui-scene-contract.js';
import type {
  UiCellSourceMapEntry,
  UiSceneLowerMode,
} from './ui-scene-lowering.js';
import type { UiTargetProfile } from './ui-scene-target-profile.js';

export function assertTextOnlyBijouNodes(nodes: readonly UiNode[]): void {
  for (const node of nodes) {
    if (node.kind === 'group' || node.kind === 'text') continue;
    throw new Error(
      `Cannot lower ui-scene-ir/1 node ${node.id} (${node.kind}) to bijou-terminal text Surface.`,
    );
  }
}

export function assertSupportedBijouRequirements(
  target: Extract<UiTargetProfile, { kind: 'bijou-terminal' }>,
  supportedRequirements: readonly string[] | undefined,
): void {
  const supported = new Set(
    supportedRequirements ?? [
      'ui-scene/core/1',
      'ui-scene/text/1',
      'ui-scene/tokens/1',
      'ui-scene/i18n/1',
      'ui-scene/actions/1',
      'ui-scene/bindings/1',
    ],
  );
  for (const requirement of target.requires ?? []) {
    if (!supported.has(requirement)) {
      throw new Error(
        `Unsupported ui-scene-ir/1 requirement for bijou-terminal: ${requirement}`,
      );
    }
  }
}

export function nodeTextForMode(
  node: UiNode,
  lowerMode: UiSceneLowerMode,
): string {
  switch (lowerMode) {
    case 'node-ids':
      return node.id;
    case 'i18n-keys':
      return node.text?.kind === 'i18n' ? node.text.key : node.id;
    case 'token-refs':
      return [
        node.style?.fg?.token,
        node.style?.bg?.token,
        node.style?.border?.token,
      ]
        .filter((token): token is string => token != null)
        .join(' ') || node.id;
    case 'normal':
      return normalNodeText(node);
  }
}

export function cellStyleForNode(
  node: UiNode,
  tokenColors: Readonly<Record<string, string>> | undefined,
): Pick<Cell, 'fg' | 'bg' | 'modifiers'> {
  const style: Pick<Cell, 'fg' | 'bg' | 'modifiers'> = {};
  const fgToken = node.style?.fg?.token;
  const bgToken = node.style?.bg?.token;
  if (fgToken != null && tokenColors?.[fgToken] != null) {
    style.fg = tokenColors[fgToken];
  }
  if (bgToken != null && tokenColors?.[bgToken] != null) {
    style.bg = tokenColors[bgToken];
  }
  if (node.style?.modifiers != null) {
    style.modifiers = [...node.style.modifiers];
  }
  return style;
}

export function cellSourceMapEntryForNode(
  node: UiNode,
  x: number,
  y: number,
  width: number,
  source: string | undefined,
): UiCellSourceMapEntry {
  const entry: UiCellSourceMapEntry = {
    nodeId: node.id,
    x,
    y,
    width,
    height: 1,
    ...(source == null ? {} : { source }),
    ...(node.text?.kind === 'i18n' ? { textKey: node.text.key } : {}),
    ...(node.style?.fg?.token == null
      ? {}
      : { fgToken: node.style.fg.token }),
    ...(node.style?.bg?.token == null
      ? {}
      : { bgToken: node.style.bg.token }),
  };
  return entry;
}

export function sanitizeLayoutCoordinate(value: number | undefined): number {
  return value !== undefined && Number.isFinite(value) ? Math.trunc(value) : 0;
}

export function visibleTextSpan(
  x: number,
  y: number,
  width: number,
  target: Extract<UiTargetProfile, { kind: 'bijou-terminal' }>,
): {
  readonly x: number;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly width: number;
} | null {
  if (width <= 0 || y < 0 || y >= target.rows) return null;
  const startOffset = Math.max(0, -x);
  const endOffset = Math.min(width, target.cols - x);
  const visibleWidth = endOffset - startOffset;
  return visibleWidth <= 0
    ? null
    : {
        x: x + startOffset,
        startOffset,
        endOffset,
        width: visibleWidth,
      };
}

function normalNodeText(node: UiNode): string {
  if (node.text?.kind === 'literal') return node.text.value;
  if (node.text?.kind === 'i18n') return node.text.fallback ?? node.text.key;
  return '';
}
