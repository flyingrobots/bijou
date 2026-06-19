import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { standardBlockPreviewText as dogfoodText } from './app-standard-block-preview-text.js';

export function standardBlockStructurePreviewSlots(
  blockName: string,
  localization: LocalizationPort,
): Readonly<Record<string, unknown>> | undefined {
  switch (blockName) {
    case 'PathProgressBlock':
      return {
        path: [
          dogfoodText(localization, 'blocks.preview.pathProgress.path.setup', 'Setup'),
          dogfoodText(localization, 'blocks.preview.pathProgress.path.blocks', 'Blocks'),
          dogfoodText(localization, 'blocks.preview.pathProgress.path.preview', 'Preview'),
        ],
        current: dogfoodText(localization, 'blocks.preview.pathProgress.current', 'Blocks'),
        step: 2,
        total: 3,
        status: dogfoodText(localization, 'blocks.preview.pathProgress.status', 'current'),
      };
    case 'BrandEmphasisBlock':
      return {
        brand: dogfoodText(localization, 'blocks.preview.brandEmphasis.brand', 'BIJOU'),
        tagline: dogfoodText(localization, 'blocks.preview.brandEmphasis.tagline', 'Terminal-native app blocks'),
        decoration: dogfoodText(localization, 'blocks.preview.brandEmphasis.decoration', 'accent rule'),
        role: dogfoodText(localization, 'blocks.preview.brandEmphasis.role', 'nonessential'),
        selected: dogfoodText(localization, 'blocks.preview.brandEmphasis.selected', 'BIJOU'),
      };
    case 'ModeAwarePrimitiveBlock':
      return {
        primitive: dogfoodText(localization, 'blocks.preview.modeAwarePrimitive.primitive', 'metric badge'),
        fact: dogfoodText(localization, 'blocks.preview.modeAwarePrimitive.fact', 'latency-ms'),
        value: 42,
        status: dogfoodText(localization, 'blocks.preview.modeAwarePrimitive.status', 'good'),
        modeContract: dogfoodText(localization, 'blocks.preview.modeAwarePrimitive.modeContract', 'visual and pipe'),
        selected: dogfoodText(localization, 'blocks.preview.modeAwarePrimitive.selected', 'metric badge'),
      };
    case 'DenseComparisonBlock':
      return {
        title: dogfoodText(localization, 'blocks.preview.denseComparison.title', 'Compare packages'),
        metric: dogfoodText(localization, 'blocks.preview.denseComparison.metric', 'tests'),
        left: '1820',
        right: '640',
        delta: '+12',
        selected: dogfoodText(localization, 'blocks.preview.denseComparison.selected', 'tests'),
      };
    case 'HierarchyBlock':
      return {
        root: dogfoodText(localization, 'blocks.preview.hierarchy.root', 'docs/'),
        nodes: [
          dogfoodText(localization, 'blocks.preview.hierarchy.node.design', 'design/'),
          dogfoodText(localization, 'blocks.preview.hierarchy.node.dx031', 'DX-031.md'),
          dogfoodText(localization, 'blocks.preview.hierarchy.node.method', 'METHOD.md'),
        ],
        selected: dogfoodText(localization, 'blocks.preview.hierarchy.selected', 'design/'),
        parent: dogfoodText(localization, 'blocks.preview.hierarchy.parent', 'docs/'),
        depth: 1,
        expanded: dogfoodText(localization, 'blocks.preview.hierarchy.expanded', 'true'),
      };
    case 'ExplorationListBlock':
      return {
        title: dogfoodText(localization, 'blocks.preview.explorationList.title', 'Explore components'),
        facet: dogfoodText(localization, 'blocks.preview.explorationList.facet', 'input'),
        items: [
          dogfoodText(localization, 'blocks.preview.explorationList.item.textEntry', 'TextEntry field input'),
          dogfoodText(localization, 'blocks.preview.explorationList.item.singleChoice', 'SingleChoice radio/select'),
        ],
        selected: dogfoodText(localization, 'blocks.preview.explorationList.selected', 'TextEntry'),
        preview: dogfoodText(localization, 'blocks.preview.explorationList.preview', 'field input'),
      };
    case 'TemporalDependencyBlock':
      return {
        title: dogfoodText(localization, 'blocks.preview.temporalDependency.title', 'Timeline'),
        events: [
          dogfoodText(localization, 'blocks.preview.temporalDependency.event.build', '09:00 build'),
          dogfoodText(localization, 'blocks.preview.temporalDependency.event.test', '09:05 test'),
          dogfoodText(localization, 'blocks.preview.temporalDependency.event.publish', '09:10 publish'),
        ],
        dependency: dogfoodText(localization, 'blocks.preview.temporalDependency.dependency', 'publish waits for test'),
        selected: dogfoodText(localization, 'blocks.preview.temporalDependency.selected', 'publish'),
        dependsOn: dogfoodText(localization, 'blocks.preview.temporalDependency.dependsOn', 'test'),
      };
    default:
      return undefined;
  }
}
