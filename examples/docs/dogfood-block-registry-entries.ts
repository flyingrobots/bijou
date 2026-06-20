import { blockPreviewBlock } from './dogfood-block-preview.js';
import { blockLabWorkbenchBlock } from './dogfood-block-workbench.js';
import { commandPaletteBlock } from './dogfood-block-command-palette.js';
import { documentationArticleBlock } from './dogfood-block-documentation-article.js';
import { dogfoodDocsSurfaceBlock } from './dogfood-block-docs-surface.js';
import { dogfoodBlockRegistryEntry } from './dogfood-block-registry-entry.js';
import { footerHintBlock } from './dogfood-block-footer-hint.js';
import { guideInspectorBlock } from './dogfood-block-guide-inspector.js';
import { helpOverlayBlock } from './dogfood-block-help-overlay.js';
import { navigationListBlock } from './dogfood-block-navigation-list.js';
import { notificationCenterBlock } from './dogfood-block-notification-center.js';
import { perfHudBlock } from './dogfood-block-perf-hud.js';
import { searchPanelBlock } from './dogfood-block-search-panel.js';
import { settingsMenuBlock } from './dogfood-block-settings-menu.js';
import { titleScreenBlock } from './dogfood-block-title-screen.js';

export const blockLabWorkbenchBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: blockLabWorkbenchBlock,
  role: 'workbench',
  surfaceId: 'blocklab.workbench',
  description: 'BlockLab component workstation entrypoint.',
  tags: ['blocklab', 'workbench'],
});

export const storybookWorkbenchBlockRegistryEntry = blockLabWorkbenchBlockRegistryEntry;

export const titleScreenBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: titleScreenBlock,
  role: 'title',
  surfaceId: 'landing.title',
  description: 'DOGFOOD title and entry action surface.',
  tags: ['title', 'entry'],
});

export const navigationListBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: navigationListBlock,
  role: 'navigation',
  surfaceId: 'docs.navigation',
  description: 'DOGFOOD docs and guide navigation surface.',
  tags: ['navigation', 'docs'],
});

export const documentationArticleBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: documentationArticleBlock,
  role: 'article',
  surfaceId: 'docs.article',
  description: 'DOGFOOD documentation article content surface.',
  tags: ['docs', 'article'],
});

export const dogfoodDocsSurfaceBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: dogfoodDocsSurfaceBlock,
  role: 'app-shell',
  surfaceId: 'docs.surface',
  description: 'DOGFOOD docs, navigation, search, reader, and proof artifact surface.',
  tags: ['docs', 'surface', 'canonical'],
});

export const blockPreviewBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: blockPreviewBlock,
  role: 'preview',
  surfaceId: 'blocks.preview',
  description: 'DOGFOOD Blocks live preview and lowering surface.',
  tags: ['blocks', 'preview'],
});

export const guideInspectorBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: guideInspectorBlock,
  role: 'inspector',
  surfaceId: 'guide.inspector',
  description: 'DOGFOOD side inspector surface.',
  tags: ['inspector', 'guide'],
});

export const settingsMenuBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: settingsMenuBlock,
  role: 'settings',
  surfaceId: 'frame.settings',
  description: 'DOGFOOD frame settings menu surface.',
  tags: ['settings', 'frame'],
});

export const searchPanelBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: searchPanelBlock,
  role: 'search',
  surfaceId: 'frame.search',
  description: 'DOGFOOD frame search query and result surface.',
  tags: ['search', 'frame'],
});

export const notificationCenterBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: notificationCenterBlock,
  role: 'notifications',
  surfaceId: 'frame.notifications',
  description: 'DOGFOOD frame notification center surface.',
  tags: ['notifications', 'frame'],
});

export const perfHudBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: perfHudBlock,
  role: 'diagnostics',
  surfaceId: 'frame.perfHud',
  description: 'DOGFOOD frame performance HUD surface.',
  tags: ['diagnostics', 'frame'],
});

export const helpOverlayBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: helpOverlayBlock,
  role: 'help',
  surfaceId: 'frame.help',
  description: 'DOGFOOD frame keyboard help overlay surface.',
  tags: ['help', 'frame'],
});

export const commandPaletteBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: commandPaletteBlock,
  role: 'commands',
  surfaceId: 'frame.commandPalette',
  description: 'DOGFOOD frame command palette surface.',
  tags: ['commands', 'frame'],
});

export const footerHintBlockRegistryEntry = dogfoodBlockRegistryEntry({
  block: footerHintBlock,
  role: 'footer',
  surfaceId: 'frame.footer',
  description: 'DOGFOOD frame footer hint surface.',
  tags: ['footer', 'frame'],
});
