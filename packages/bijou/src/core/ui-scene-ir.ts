import { createSurface, type Cell, type Surface } from '../ports/surface.js';
import { segmentSurfaceText } from './components/surface-text.js';

export const UI_SCENE_IR_VERSION = 'ui-scene-ir/1' as const;
export const UI_SCENE_RECEIPT_VERSION = 'ui-scene-receipt/1' as const;

export type UiSceneIrVersion = typeof UI_SCENE_IR_VERSION;
export type UiSceneReceiptVersion = typeof UI_SCENE_RECEIPT_VERSION;
export type UiNodeKind = 'box' | 'text' | 'image' | 'group' | 'list' | 'table' | 'custom' | 'markdown';
export type UiTextRef =
  | { readonly kind: 'literal'; readonly value: string }
  | { readonly kind: 'i18n'; readonly key: string; readonly fallback?: string };

export type UiStyleRef = {
  readonly fg?: { readonly token: string };
  readonly bg?: { readonly token: string };
  readonly border?: { readonly token: string };
  readonly modifiers?: readonly string[];
};

export interface UiLayoutIntent {
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
}

export interface UiNode {
  readonly id: string;
  readonly kind: UiNodeKind;
  readonly role?: string;
  readonly component?: string;
  readonly parentId?: string;
  readonly children?: readonly string[];
  readonly layout?: UiLayoutIntent;
  readonly text?: UiTextRef;
  readonly style?: UiStyleRef;
  readonly actions?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UiBinding {
  readonly id: string;
  readonly targetNodeId: string;
  readonly targetProperty: string;
  readonly source: {
    readonly kind: 'state' | 'query' | 'computed';
    readonly path: string;
  };
  readonly when?: string;
}

export interface UiAction {
  readonly id: string;
  readonly label?: UiTextRef;
  readonly command: string;
  readonly keybindings?: readonly string[];
  readonly targetNodeId?: string;
}

export interface UiTokenUse {
  readonly nodeId: string;
  readonly slot: 'fg' | 'bg' | 'border' | string;
  readonly token: string;
}

export interface UiI18nUse {
  readonly nodeId?: string;
  readonly actionId?: string;
  readonly key: string;
}

export interface UiSourceMapEntry {
  readonly nodeId: string;
  readonly source: string;
}

export type UiTargetProfile =
  | {
      readonly kind: 'bijou-terminal';
      readonly cols: number;
      readonly rows: number;
      readonly requires?: readonly string[];
      readonly claims?: readonly string[];
    }
  | {
      readonly kind: 'geordi-browser' | 'geordi-image';
      readonly width: number;
      readonly height: number;
      readonly requires?: readonly string[];
      readonly claims?: readonly string[];
    }
  | {
      readonly kind: 'geordi-packed-bijou-cells';
      readonly cols: number;
      readonly rows: number;
      readonly requires?: readonly string[];
      readonly claims?: readonly string[];
    }
  | {
      readonly kind: 'geordi-unity' | 'external-visual-import';
      readonly requires?: readonly string[];
      readonly claims?: readonly string[];
    }
  | {
      readonly kind: `custom:${string}`;
      readonly requires?: readonly string[];
      readonly claims?: readonly string[];
    };

export type UiPortabilityLevel = 'portable' | 'terminal-native' | 'visual-only' | 'host-adapter';

export interface UiPortabilityClaim {
  readonly level: UiPortabilityLevel;
  readonly reasons?: readonly string[];
}

export interface UiSceneIr {
  readonly irVersion: UiSceneIrVersion;
  readonly id: string;
  readonly sourceHash: string;
  readonly rootNodeId: string;
  readonly nodes: readonly UiNode[];
  readonly bindings: readonly UiBinding[];
  readonly actions: readonly UiAction[];
  readonly tokenUses: readonly UiTokenUse[];
  readonly i18nUses: readonly UiI18nUse[];
  readonly sourceMap: readonly UiSourceMapEntry[];
  readonly targetProfiles: readonly UiTargetProfile[];
  readonly portability?: UiPortabilityClaim;
}

export type UiSceneIssueCode =
  | 'unsupported-ir-version'
  | 'root-node-missing'
  | 'duplicate-node-id'
  | 'duplicate-action-id'
  | 'duplicate-binding-id'
  | 'child-node-missing'
  | 'parent-node-missing'
  | 'node-action-missing'
  | 'action-target-missing'
  | 'binding-target-missing'
  | 'token-node-missing'
  | 'i18n-node-missing'
  | 'i18n-action-missing'
  | 'source-map-node-missing'
  | 'invalid-target-profile';

export interface UiSceneValidationIssue {
  readonly code: UiSceneIssueCode;
  readonly message: string;
  readonly id?: string;
}

export interface UiSceneValidationResult {
  readonly ok: boolean;
  readonly issues: readonly UiSceneValidationIssue[];
}

export interface UiSceneReceipt {
  readonly receiptVersion: UiSceneReceiptVersion;
  readonly sceneHash: string;
  readonly sourceHash: string;
  readonly nodeIds: readonly string[];
  readonly componentIds: readonly string[];
  readonly i18nKeys: readonly string[];
  readonly tokenRefs: readonly string[];
  readonly actionIds: readonly string[];
  readonly bindingIds: readonly string[];
  readonly outputs: {
    readonly terminal?: {
      readonly layoutHash: string;
      readonly surfaceHash: string;
    };
    readonly browser?: {
      readonly endpointHash: string;
      readonly witnessHash: string;
    };
    readonly packedCells?: {
      readonly targetHash: string;
      readonly surfaceHash: string;
    };
  };
}

export type UiSceneLowerMode = 'normal' | 'node-ids' | 'i18n-keys' | 'token-refs';

export interface UiSceneLoweringOptions {
  readonly lowerMode?: UiSceneLowerMode;
  readonly tokenColors?: Readonly<Record<string, string>>;
  readonly supportedRequirements?: readonly string[];
}

export interface UiCellSourceMapEntry {
  readonly nodeId: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly source?: string;
  readonly textKey?: string;
  readonly fgToken?: string;
  readonly bgToken?: string;
}

export interface UiSceneSurfaceLowering {
  readonly surface: Surface;
  readonly targetProfile: Extract<UiTargetProfile, { kind: 'bijou-terminal' }>;
  readonly cellSourceMap: readonly UiCellSourceMapEntry[];
  readonly sceneHash: string;
  readonly surfaceHash: string;
}

export interface UiSceneTerminalProof {
  readonly lowering: UiSceneSurfaceLowering;
  readonly receipt: UiSceneReceipt;
}

const DEFAULT_SUPPORTED_BIJOU_REQUIREMENTS = new Set([
  'ui-scene/core/1',
  'ui-scene/text/1',
  'ui-scene/tokens/1',
  'ui-scene/i18n/1',
  'ui-scene/actions/1',
  'ui-scene/bindings/1',
]);

export function stableUiSceneStringify(value: unknown): string {
  const normalized = normalizeStableJson(value);
  if (normalized === undefined) {
    throw new Error('ui-scene-ir/1 JSON value cannot be top-level undefined');
  }
  return JSON.stringify(normalized);
}

export function hashUiSceneValue(value: unknown): string {
  const source = stableUiSceneStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < source.length; index++) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function validateUiSceneIr(scene: UiSceneIr): UiSceneValidationResult {
  const issues: UiSceneValidationIssue[] = [];
  if (scene.irVersion !== UI_SCENE_IR_VERSION) {
    issues.push({
      code: 'unsupported-ir-version',
      message: `Unsupported UI scene IR version: ${scene.irVersion}`,
      id: scene.irVersion,
    });
  }

  const nodeIds = new Set<string>();
  const duplicateNodeIds = new Set<string>();
  for (const node of scene.nodes) {
    if (nodeIds.has(node.id)) {
      duplicateNodeIds.add(node.id);
      continue;
    }
    nodeIds.add(node.id);
  }

  if (!nodeIds.has(scene.rootNodeId)) {
    issues.push({
      code: 'root-node-missing',
      message: `Root node does not exist: ${scene.rootNodeId}`,
      id: scene.rootNodeId,
    });
  }

  for (const id of duplicateNodeIds) {
    issues.push({
      code: 'duplicate-node-id',
      message: `Duplicate node id: ${id}`,
      id,
    });
  }

  const actionIds = new Set<string>();
  const duplicateActionIds = new Set<string>();
  for (const action of scene.actions) {
    if (actionIds.has(action.id)) {
      duplicateActionIds.add(action.id);
      continue;
    }
    actionIds.add(action.id);
  }
  for (const id of duplicateActionIds) {
    issues.push({
      code: 'duplicate-action-id',
      message: `Duplicate action id: ${id}`,
      id,
    });
  }

  const bindingIds = new Set<string>();
  const duplicateBindingIds = new Set<string>();
  for (const binding of scene.bindings) {
    if (bindingIds.has(binding.id)) {
      duplicateBindingIds.add(binding.id);
      continue;
    }
    bindingIds.add(binding.id);
  }
  for (const id of duplicateBindingIds) {
    issues.push({
      code: 'duplicate-binding-id',
      message: `Duplicate binding id: ${id}`,
      id,
    });
  }

  for (const node of scene.nodes) {
    if (node.parentId != null && !nodeIds.has(node.parentId)) {
      issues.push({
        code: 'parent-node-missing',
        message: `Node ${node.id} references missing parent ${node.parentId}`,
        id: node.id,
      });
    }
    for (const childId of node.children ?? []) {
      if (!nodeIds.has(childId)) {
        issues.push({
          code: 'child-node-missing',
          message: `Node ${node.id} references missing child ${childId}`,
          id: node.id,
        });
      }
    }
    for (const actionId of node.actions ?? []) {
      if (!actionIds.has(actionId)) {
        issues.push({
          code: 'node-action-missing',
          message: `Node ${node.id} references missing action ${actionId}`,
          id: node.id,
        });
      }
    }
  }

  for (const action of scene.actions) {
    if (action.targetNodeId != null && !nodeIds.has(action.targetNodeId)) {
      issues.push({
        code: 'action-target-missing',
        message: `Action ${action.id} references missing target ${action.targetNodeId}`,
        id: action.id,
      });
    }
  }

  for (const binding of scene.bindings) {
    if (!nodeIds.has(binding.targetNodeId)) {
      issues.push({
        code: 'binding-target-missing',
        message: `Binding ${binding.id} references missing target ${binding.targetNodeId}`,
        id: binding.id,
      });
    }
  }

  for (const tokenUse of scene.tokenUses) {
    if (!nodeIds.has(tokenUse.nodeId)) {
      issues.push({
        code: 'token-node-missing',
        message: `Token ${tokenUse.token} references missing node ${tokenUse.nodeId}`,
        id: tokenUse.nodeId,
      });
    }
  }

  for (const i18nUse of scene.i18nUses) {
    if (i18nUse.nodeId != null && !nodeIds.has(i18nUse.nodeId)) {
      issues.push({
        code: 'i18n-node-missing',
        message: `I18n key ${i18nUse.key} references missing node ${i18nUse.nodeId}`,
        id: i18nUse.nodeId,
      });
    }
    if (i18nUse.actionId != null && !actionIds.has(i18nUse.actionId)) {
      issues.push({
        code: 'i18n-action-missing',
        message: `I18n key ${i18nUse.key} references missing action ${i18nUse.actionId}`,
        id: i18nUse.actionId,
      });
    }
  }

  for (const sourceMapEntry of scene.sourceMap) {
    if (!nodeIds.has(sourceMapEntry.nodeId)) {
      issues.push({
        code: 'source-map-node-missing',
        message: `Source map references missing node ${sourceMapEntry.nodeId}`,
        id: sourceMapEntry.nodeId,
      });
    }
  }

  for (let index = 0; index < scene.targetProfiles.length; index++) {
    const profile = scene.targetProfiles[index]!;
    const issue = validateTargetProfile(profile, index);
    if (issue != null) {
      issues.push(issue);
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

export function createUiSceneReceipt(
  scene: UiSceneIr,
  outputs: UiSceneReceipt['outputs'] = {},
): UiSceneReceipt {
  return {
    receiptVersion: UI_SCENE_RECEIPT_VERSION,
    sceneHash: hashUiSceneValue(scene),
    sourceHash: scene.sourceHash,
    nodeIds: sortedUnique(scene.nodes.map((node) => node.id)),
    componentIds: sortedUnique(scene.nodes.flatMap((node) => node.component == null ? [] : [node.component])),
    i18nKeys: sortedUnique(scene.i18nUses.map((use) => use.key)),
    tokenRefs: sortedUnique(scene.tokenUses.map((use) => use.token)),
    actionIds: sortedUnique(scene.actions.map((action) => action.id)),
    bindingIds: sortedUnique(scene.bindings.map((binding) => binding.id)),
    outputs,
  };
}

export function lowerUiSceneToSurface(
  scene: UiSceneIr,
  options: UiSceneLoweringOptions = {},
): UiSceneSurfaceLowering {
  const validation = validateUiSceneIr(scene);
  if (!validation.ok) {
    throw new Error(`Invalid ui-scene-ir/1: ${validation.issues.map((issue) => issue.message).join('; ')}`);
  }

  const targetProfile = scene.targetProfiles.find(
    (profile): profile is Extract<UiTargetProfile, { kind: 'bijou-terminal' }> => profile.kind === 'bijou-terminal',
  );
  if (targetProfile == null) {
    throw new Error('Cannot lower ui-scene-ir/1 without a bijou-terminal target profile.');
  }

  assertSupportedBijouRequirements(targetProfile, options.supportedRequirements);

  const surface = createSurface(targetProfile.cols, targetProfile.rows);
  const cellSourceMap: UiCellSourceMapEntry[] = [];
  const lowerMode = options.lowerMode ?? 'normal';
  const sourceByNodeId = new Map(scene.sourceMap.map((entry) => [entry.nodeId, entry.source]));

  for (const node of scene.nodes) {
    if (node.kind !== 'text') {
      continue;
    }

    const text = nodeTextForMode(node, lowerMode);
    const graphemes = segmentSurfaceText(text, 'lowerUiSceneToSurface');
    const x = sanitizeLayoutCoordinate(node.layout?.x);
    const y = sanitizeLayoutCoordinate(node.layout?.y);
    const style = cellStyleForNode(node, options.tokenColors);
    const visibleSpan = visibleTextSpan(x, y, graphemes.length, targetProfile);
    if (visibleSpan == null) {
      continue;
    }

    for (let offset = visibleSpan.startOffset; offset < visibleSpan.endOffset; offset++) {
      surface.set(x + offset, y, {
        char: graphemes[offset]!,
        ...style,
        empty: false,
      });
    }

    cellSourceMap.push(cellSourceMapEntryForNode(node, visibleSpan.x, y, visibleSpan.width, sourceByNodeId.get(node.id)));
  }

  return {
    surface,
    targetProfile,
    cellSourceMap,
    sceneHash: hashUiSceneValue(scene),
    surfaceHash: hashSurface(surface),
  };
}

export function createUiSceneTerminalReceipt(
  scene: UiSceneIr,
  lowering: UiSceneSurfaceLowering,
): UiSceneReceipt {
  const sceneHash = hashUiSceneValue(scene);
  if (lowering.sceneHash !== sceneHash) {
    throw new Error('Terminal lowering was created for a different ui-scene-ir/1 scene.');
  }
  return createUiSceneReceipt(scene, {
    terminal: {
      layoutHash: hashUiSceneValue({
        cellSourceMap: lowering.cellSourceMap,
        targetProfile: lowering.targetProfile,
      }),
      surfaceHash: lowering.surfaceHash,
    },
  });
}

export function lowerUiSceneToTerminalProof(
  scene: UiSceneIr,
  options: UiSceneLoweringOptions = {},
): UiSceneTerminalProof {
  const lowering = lowerUiSceneToSurface(scene, options);
  return {
    lowering,
    receipt: createUiSceneTerminalReceipt(scene, lowering),
  };
}

function assertSupportedBijouRequirements(
  targetProfile: Extract<UiTargetProfile, { kind: 'bijou-terminal' }>,
  supportedRequirements: readonly string[] | undefined,
): void {
  const supported = supportedRequirements == null
    ? DEFAULT_SUPPORTED_BIJOU_REQUIREMENTS
    : new Set(supportedRequirements);
  for (const requirement of targetProfile.requires ?? []) {
    if (!supported.has(requirement)) {
      throw new Error(`Unsupported ui-scene-ir/1 requirement for bijou-terminal: ${requirement}`);
    }
  }
}

function nodeTextForMode(node: UiNode, lowerMode: UiSceneLowerMode): string {
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
      ].filter((token): token is string => token != null).join(' ') || node.id;
    case 'normal':
      return normalNodeText(node);
  }
}

function normalNodeText(node: UiNode): string {
  if (node.text?.kind === 'literal') {
    return node.text.value;
  }
  if (node.text?.kind === 'i18n') {
    return node.text.fallback ?? node.text.key;
  }
  return '';
}

function cellStyleForNode(
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

function cellSourceMapEntryForNode(
  node: UiNode,
  x: number,
  y: number,
  width: number,
  source: string | undefined,
): UiCellSourceMapEntry {
  const entry: {
    nodeId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    source?: string;
    textKey?: string;
    fgToken?: string;
    bgToken?: string;
  } = {
    nodeId: node.id,
    x,
    y,
    width,
    height: 1,
  };
  if (source != null) {
    entry.source = source;
  }
  if (node.text?.kind === 'i18n') {
    entry.textKey = node.text.key;
  }
  if (node.style?.fg?.token != null) {
    entry.fgToken = node.style.fg.token;
  }
  if (node.style?.bg?.token != null) {
    entry.bgToken = node.style.bg.token;
  }
  return entry;
}

function hashSurface(surface: Surface): string {
  const cells = [];
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      const cell = surface.get(x, y);
      cells.push({
        bg: cell.bg,
        bgRGB: cell.bgRGB,
        char: cell.char,
        empty: cell.empty,
        fg: cell.fg,
        fgRGB: cell.fgRGB,
        modifiers: cell.modifiers,
        opacity: cell.opacity,
      });
    }
  }
  return hashUiSceneValue({
    cells,
    height: surface.height,
    width: surface.width,
  });
}

function sanitizeLayoutCoordinate(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value as number)) : 0;
}

function sortedUnique(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort(compareCodeUnits);
}

function visibleTextSpan(
  x: number,
  y: number,
  width: number,
  targetProfile: Extract<UiTargetProfile, { kind: 'bijou-terminal' }>,
): { readonly x: number; readonly startOffset: number; readonly endOffset: number; readonly width: number } | null {
  if (width <= 0 || y < 0 || y >= targetProfile.rows) {
    return null;
  }
  const startOffset = Math.max(0, -x);
  const endOffset = Math.min(width, targetProfile.cols - x);
  const visibleWidth = endOffset - startOffset;
  if (visibleWidth <= 0) {
    return null;
  }
  return {
    x: x + startOffset,
    startOffset,
    endOffset,
    width: visibleWidth,
  };
}

function validateTargetProfile(profile: UiTargetProfile, index: number): UiSceneValidationIssue | null {
  switch (profile.kind) {
    case 'bijou-terminal':
      return validPositiveDimension(profile.cols) && validPositiveDimension(profile.rows)
        ? null
        : invalidTargetProfile(profile.kind, index, 'bijou-terminal target profiles require positive integer cols and rows');
    case 'geordi-browser':
    case 'geordi-image':
      return validPositiveDimension(profile.width) && validPositiveDimension(profile.height)
        ? null
        : invalidTargetProfile(profile.kind, index, `${profile.kind} target profiles require positive integer width and height`);
    case 'geordi-packed-bijou-cells':
      return validPositiveDimension(profile.cols) && validPositiveDimension(profile.rows)
        ? null
        : invalidTargetProfile(profile.kind, index, 'geordi-packed-bijou-cells target profiles require positive integer cols and rows');
    case 'geordi-unity':
    case 'external-visual-import':
      return null;
    default:
      return profile.kind.startsWith('custom:')
        ? null
        : invalidTargetProfile(profile.kind, index, `Unknown target profile kind: ${profile.kind}`);
  }
}

function invalidTargetProfile(kind: string, index: number, reason: string): UiSceneValidationIssue {
  return {
    code: 'invalid-target-profile',
    message: `Invalid target profile ${kind} at index ${index}: ${reason}`,
    id: `${kind}:${index}`,
  };
}

function validPositiveDimension(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function compareCodeUnits(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function normalizeStableJson(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`ui-scene-ir/1 JSON value must be finite; got ${String(value)}`);
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeStableJson(item));
  }
  if (typeof value === 'object') {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(input).sort(compareCodeUnits)) {
      const normalized = normalizeStableJson(input[key]);
      if (normalized !== undefined) {
        output[key] = normalized;
      }
    }
    return output;
  }
  throw new Error(`ui-scene-ir/1 JSON value cannot contain ${typeof value}`);
}
