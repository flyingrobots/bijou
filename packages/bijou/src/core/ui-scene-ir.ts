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

export interface UiStyleRef {
  readonly fg?: { readonly token: string };
  readonly bg?: { readonly token: string };
  readonly border?: { readonly token: string };
  readonly modifiers?: readonly string[];
}

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
  return `sha256:${sha256Hex(source)}`;
}

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
] as const;

function sha256Hex(source: string): string {
  const sourceBytes = new TextEncoder().encode(source);
  const bitLength = sourceBytes.length * 8;
  const paddedLength = Math.ceil((sourceBytes.length + 9) / 64) * 64;
  const bytes = new Uint8Array(paddedLength);
  bytes.set(sourceBytes);
  bytes[sourceBytes.length] = 0x80;

  const view = new DataView(bytes.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x1_0000_0000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;
  const words = new Uint32Array(64);

  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let index = 0; index < 16; index++) {
      words[index] = view.getUint32(offset + index * 4);
    }
    for (let index = 16; index < 64; index++) {
      words[index] = (
        sha256SmallSigma1(words[index - 2]!)
        + words[index - 7]!
        + sha256SmallSigma0(words[index - 15]!)
        + words[index - 16]!
      ) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let index = 0; index < 64; index++) {
      const temp1 = (
        h
        + sha256BigSigma1(e)
        + ((e & f) ^ (~e & g))
        + SHA256_K[index]!
        + words[index]!
      ) >>> 0;
      const temp2 = (sha256BigSigma0(a) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((word) => word.toString(16).padStart(8, '0'))
    .join('');
}

function sha256RotateRight(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits));
}

function sha256BigSigma0(value: number): number {
  return sha256RotateRight(value, 2) ^ sha256RotateRight(value, 13) ^ sha256RotateRight(value, 22);
}

function sha256BigSigma1(value: number): number {
  return sha256RotateRight(value, 6) ^ sha256RotateRight(value, 11) ^ sha256RotateRight(value, 25);
}

function sha256SmallSigma0(value: number): number {
  return sha256RotateRight(value, 7) ^ sha256RotateRight(value, 18) ^ (value >>> 3);
}

function sha256SmallSigma1(value: number): number {
  return sha256RotateRight(value, 17) ^ sha256RotateRight(value, 19) ^ (value >>> 10);
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
    i18nKeys: sceneI18nKeys(scene),
    tokenRefs: sceneTokenRefs(scene),
    actionIds: sortedUnique(scene.actions.map((action) => action.id)),
    bindingIds: sortedUnique(scene.bindings.map((binding) => binding.id)),
    outputs,
  };
}

function sceneI18nKeys(scene: UiSceneIr): readonly string[] {
  return sortedUnique([
    ...scene.i18nUses.map((use) => use.key),
    ...scene.nodes.flatMap((node) => node.text?.kind === 'i18n' ? [node.text.key] : []),
    ...scene.actions.flatMap((action) => action.label?.kind === 'i18n' ? [action.label.key] : []),
  ]);
}

function sceneTokenRefs(scene: UiSceneIr): readonly string[] {
  return sortedUnique([
    ...scene.tokenUses.map((use) => use.token),
    ...scene.nodes.flatMap(nodeStyleTokenRefs),
  ]);
}

function nodeStyleTokenRefs(node: UiNode): readonly string[] {
  return [
    node.style?.fg?.token,
    node.style?.bg?.token,
    node.style?.border?.token,
  ].filter((token): token is string => token != null);
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
  assertTextOnlyBijouNodes(scene);

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

function assertTextOnlyBijouNodes(scene: UiSceneIr): void {
  for (const node of scene.nodes) {
    if (node.kind === 'group' || node.kind === 'text') {
      continue;
    }
    throw new Error(`Cannot lower ui-scene-ir/1 node ${node.id} (${node.kind}) to bijou-terminal text Surface.`);
  }
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
  return Number.isFinite(value) ? Math.trunc(value!) : 0;
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
