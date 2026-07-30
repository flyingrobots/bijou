import { createSurface, type Surface } from '../ports/surface.js';
import { segmentSurfaceText } from './components/surface-text.js';
import { hashUiSceneSurface, hashUiSceneValue } from './ui-scene-canonical.js';
import type { UiSceneIr } from './ui-scene-contract.js';
import {
  assertSupportedBijouRequirements,
  assertTextOnlyBijouNodes,
  cellSourceMapEntryForNode,
  cellStyleForNode,
  nodeTextForMode,
  sanitizeLayoutCoordinate,
  visibleTextSpan,
} from './ui-scene-lowering-utils.js';
import type { UiTargetProfile } from './ui-scene-target-profile.js';
import { validateUiSceneIr } from './ui-scene-validation.js';

export type UiSceneLowerMode =
  | 'normal'
  | 'node-ids'
  | 'i18n-keys'
  | 'token-refs';

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
  readonly targetProfile: Extract<
    UiTargetProfile,
    { kind: 'bijou-terminal' }
  >;
  readonly cellSourceMap: readonly UiCellSourceMapEntry[];
  readonly sceneHash: string;
  readonly surfaceHash: string;
}

export function lowerUiSceneToSurface(
  scene: UiSceneIr,
  options: UiSceneLoweringOptions = {},
): UiSceneSurfaceLowering {
  const validation = validateUiSceneIr(scene);
  if (!validation.ok) {
    throw new Error(
      `Invalid ui-scene-ir/1: ${validation.issues.map((issue) => issue.message).join('; ')}`,
    );
  }
  const targetProfile = scene.targetProfiles.find(
    (
      profile,
    ): profile is Extract<UiTargetProfile, { kind: 'bijou-terminal' }> =>
      profile.kind === 'bijou-terminal',
  );
  if (targetProfile == null) {
    throw new Error(
      'Cannot lower ui-scene-ir/1 without a bijou-terminal target profile.',
    );
  }
  assertSupportedBijouRequirements(
    targetProfile,
    options.supportedRequirements,
  );
  assertTextOnlyBijouNodes(scene.nodes);
  const surface = createSurface(targetProfile.cols, targetProfile.rows);
  const cellSourceMap: UiCellSourceMapEntry[] = [];
  const lowerMode = options.lowerMode ?? 'normal';
  const sourceByNodeId = new Map(
    scene.sourceMap.map((entry) => [entry.nodeId, entry.source]),
  );
  for (const node of scene.nodes) {
    if (node.kind !== 'text') continue;
    const text = nodeTextForMode(node, lowerMode);
    const graphemes = segmentSurfaceText(text, 'lowerUiSceneToSurface');
    const x = sanitizeLayoutCoordinate(node.layout?.x);
    const y = sanitizeLayoutCoordinate(node.layout?.y);
    const style = cellStyleForNode(node, options.tokenColors);
    const visible = visibleTextSpan(x, y, graphemes.length, targetProfile);
    if (visible == null) continue;
    for (let offset = visible.startOffset; offset < visible.endOffset; offset++) {
      surface.set(x + offset, y, {
        char: graphemes[offset] ?? ' ',
        ...style,
        empty: false,
      });
    }
    cellSourceMap.push(
      cellSourceMapEntryForNode(
        node,
        visible.x,
        y,
        visible.width,
        sourceByNodeId.get(node.id),
      ),
    );
  }
  return {
    surface,
    targetProfile,
    cellSourceMap,
    sceneHash: hashUiSceneValue(scene),
    surfaceHash: hashUiSceneSurface(surface),
  };
}
