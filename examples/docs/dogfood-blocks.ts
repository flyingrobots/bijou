import { dogfoodBlockRegistry } from './dogfood-block-registry.js';
import type { DogfoodBlockRegistry } from './dogfood-block-registry.js';
import {
  blockLabWorkbenchBlockRegistryEntry,
  blockPreviewBlockRegistryEntry,
  commandPaletteBlockRegistryEntry,
  documentationArticleBlockRegistryEntry,
  dogfoodDocsSurfaceBlockRegistryEntry,
  footerHintBlockRegistryEntry,
  guideInspectorBlockRegistryEntry,
  helpOverlayBlockRegistryEntry,
  navigationListBlockRegistryEntry,
  notificationCenterBlockRegistryEntry,
  perfHudBlockRegistryEntry,
  searchPanelBlockRegistryEntry,
  settingsMenuBlockRegistryEntry,
  titleScreenBlockRegistryEntry,
} from './dogfood-block-registry-entries.js';

export { DOGFOOD_BLOCK_PACKAGE } from './dogfood-block-common.js';
export type { DogfoodBlockDefinition, DogfoodBlockRole } from './dogfood-block-common.js';
export * from './dogfood-block-command-palette.js';
export * from './dogfood-block-docs-surface.js';
export * from './dogfood-block-docs-surface-data.js';
export * from './dogfood-block-docs-surface-schema.js';
export * from './dogfood-block-docs-surface-types.js';
export * from './dogfood-block-documentation-article.js';
export * from './dogfood-block-footer-hint.js';
export * from './dogfood-block-guide-inspector.js';
export * from './dogfood-block-help-overlay.js';
export * from './dogfood-block-navigation-list.js';
export * from './dogfood-block-notification-center.js';
export * from './dogfood-block-perf-hud.js';
export * from './dogfood-block-preview.js';
export { DogfoodBlockRegistry, dogfoodBlockRegistry, isDogfoodBlockRegistry } from './dogfood-block-registry.js';
export * from './dogfood-block-registry-entries.js';
export { dogfoodBlockRegistryEntry, isDogfoodBlockRegistryEntry } from './dogfood-block-registry-entry.js';
export type { DogfoodBlockRegistryEntry, DogfoodBlockRegistryEntryInput } from './dogfood-block-registry-types.js';
export * from './dogfood-block-search-panel.js';
export * from './dogfood-block-settings-menu.js';
export * from './dogfood-block-title-screen.js';
export * from './dogfood-block-workbench.js';

export const requiredDogfoodBlockSurfaceIds: readonly string[] = Object.freeze([
  'landing.title',
  'docs.navigation',
  'docs.article',
  'docs.surface',
  'blocks.preview',
  'guide.inspector',
  'frame.settings',
  'frame.search',
  'frame.notifications',
  'frame.perfHud',
  'frame.help',
  'frame.commandPalette',
  'frame.footer',
  'blocklab.workbench',
]);

export const defaultDogfoodBlockRegistry = dogfoodBlockRegistry([
  titleScreenBlockRegistryEntry,
  navigationListBlockRegistryEntry,
  documentationArticleBlockRegistryEntry,
  dogfoodDocsSurfaceBlockRegistryEntry,
  blockPreviewBlockRegistryEntry,
  guideInspectorBlockRegistryEntry,
  settingsMenuBlockRegistryEntry,
  searchPanelBlockRegistryEntry,
  notificationCenterBlockRegistryEntry,
  perfHudBlockRegistryEntry,
  helpOverlayBlockRegistryEntry,
  commandPaletteBlockRegistryEntry,
  footerHintBlockRegistryEntry,
  blockLabWorkbenchBlockRegistryEntry,
]);

export interface DogfoodBlockCoverageReport {
  readonly requiredSurfaceIds: readonly string[];
  readonly registeredSurfaceIds: readonly string[];
  readonly missingSurfaceIds: readonly string[];
}

export function dogfoodBlockCoverageReport(
  registry: DogfoodBlockRegistry = defaultDogfoodBlockRegistry,
): DogfoodBlockCoverageReport {
  const registeredSurfaceIds = registry.surfaceIds();
  const registered = new Set(registeredSurfaceIds);

  return Object.freeze({
    requiredSurfaceIds: requiredDogfoodBlockSurfaceIds,
    registeredSurfaceIds,
    missingSurfaceIds: Object.freeze(
      requiredDogfoodBlockSurfaceIds.filter((surfaceId) => !registered.has(surfaceId)),
    ),
  });
}
