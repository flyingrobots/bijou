import type { UiSceneBrowserTargetProfile } from './ui-scene-browser-contract.js';
import type { UiNode, UiSceneIr } from './ui-scene-contract.js';

const DEFAULT_REQUIREMENTS: readonly string[] = [
  'ui-scene/core/1',
  'ui-scene/text/1',
  'ui-scene/tokens/1',
  'ui-scene/i18n/1',
  'ui-scene/actions/1',
  'ui-scene/bindings/1',
];

export function browserTargetProfile(
  scene: UiSceneIr,
): UiSceneBrowserTargetProfile {
  for (const profile of scene.targetProfiles) {
    if (profile.kind !== 'geordi-browser') continue;
    return {
      kind: 'geordi-browser',
      width: profile.width,
      height: profile.height,
      ...(profile.requires == null ? {} : { requires: profile.requires }),
      ...(profile.claims == null ? {} : { claims: profile.claims }),
    };
  }
  throw new Error(
    'Cannot lower ui-scene-ir/1 without a geordi-browser target profile.',
  );
}

export function assertSupportedBrowserRequirements(
  target: UiSceneBrowserTargetProfile,
  supportedRequirements: readonly string[] | undefined,
): void {
  const supported = new Set(supportedRequirements ?? DEFAULT_REQUIREMENTS);
  for (const requirement of target.requires ?? []) {
    if (!supported.has(requirement)) {
      throw new Error(
        `Unsupported ui-scene-ir/1 requirement for geordi-browser: ${requirement}`,
      );
    }
  }
}

export function assertBrowserNodeKinds(nodes: readonly UiNode[]): void {
  for (const node of nodes) {
    if (node.kind === 'group' || node.kind === 'text') continue;
    throw new Error(
      `Cannot lower ui-scene-ir/1 node ${node.id} (${node.kind}) to a geordi-browser element.`,
    );
  }
}
