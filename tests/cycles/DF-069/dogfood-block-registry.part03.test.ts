import { describe, expect, it } from 'vitest';
import { blockPreviewBlock, blockPreviewBlockRegistryEntry, commandPaletteBlock, commandPaletteBlockRegistryEntry, defaultDogfoodBlockRegistry, documentationArticleBlock, documentationArticleBlockRegistryEntry, dogfoodDocsSurfaceBlock, dogfoodDocsSurfaceBlockRegistryEntry, helpOverlayBlock, helpOverlayBlockRegistryEntry, settingsMenuBlock, settingsMenuBlockRegistryEntry } from '../../../examples/docs/dogfood-blocks.js';

describe('DF-069 DOGFOOD block registry primitives', () => {
  it('publishes DOGFOOD help overlay as an inspectable keyboard guidance surface', () => {
      expect(helpOverlayBlockRegistryEntry.block).toBe(helpOverlayBlock);
      expect(helpOverlayBlockRegistryEntry.role).toBe('help');
      expect(defaultDogfoodBlockRegistry.forSurface('frame.help')).toBe(helpOverlayBlockRegistryEntry);
      expect(helpOverlayBlock.data?.names()).toEqual(['bindings', 'scope']);
      expect(helpOverlayBlock.commands?.map((intent) => intent.id)).toEqual(['help.dismiss']);

      expect(helpOverlayBlock.render({
        config: {
          bindingCount: 12,
          scopeLabel: 'Blocks page',
        },
        mode: 'pipe',
      }).output).toBe('Help scope: Blocks page; bindings: 12');
    });

  it('publishes DOGFOOD command palette as an inspectable command surface', () => {
      expect(commandPaletteBlockRegistryEntry.block).toBe(commandPaletteBlock);
      expect(commandPaletteBlockRegistryEntry.role).toBe('commands');
      expect(defaultDogfoodBlockRegistry.forSurface('frame.commandPalette')).toBe(
        commandPaletteBlockRegistryEntry,
      );
      expect(commandPaletteBlock.data?.names()).toEqual(['commands', 'selection']);
      expect(commandPaletteBlock.commands?.map((intent) => intent.id)).toEqual([
        'commandPalette.execute',
        'commandPalette.dismiss',
      ]);

      expect(commandPaletteBlock.render({
        config: {
          commandCount: 8,
          activeCommandLabel: 'Open settings',
        },
        mode: 'pipe',
      }).output).toBe('Command palette commands: 8; active: Open settings');
    });

  it('publishes DOGFOOD documentation articles as semantic content blocks', () => {
      expect(documentationArticleBlockRegistryEntry.block).toBe(documentationArticleBlock);
      expect(documentationArticleBlockRegistryEntry.role).toBe('article');
      expect(defaultDogfoodBlockRegistry.forSurface('docs.article')).toBe(
        documentationArticleBlockRegistryEntry,
      );
      expect(documentationArticleBlock.data?.names()).toEqual(['article', 'headings']);
      expect(documentationArticleBlock.commands?.map((intent) => intent.id)).toEqual([
        'documentation.selectHeading',
        'documentation.openReference',
      ]);

      expect(documentationArticleBlock.render({
        config: {
          title: 'Blocks',
          headingCount: 5,
        },
        mode: 'accessible',
      }).output).toBe('Article: Blocks; headings: 5');
    });

  it('publishes the canonical DOGFOOD docs surface as an app-level block', () => {
      expect(dogfoodDocsSurfaceBlockRegistryEntry.block).toBe(dogfoodDocsSurfaceBlock);
      expect(dogfoodDocsSurfaceBlockRegistryEntry.role).toBe('app-shell');
      expect(defaultDogfoodBlockRegistry.forSurface('docs.surface')).toBe(
        dogfoodDocsSurfaceBlockRegistryEntry,
      );
      expect(dogfoodDocsSurfaceBlock.data?.names()).toEqual([
        'docsTree',
        'selectedRoute',
        'searchState',
        'proofArtifacts',
      ]);
      expect(dogfoodDocsSurfaceBlock.commands?.map((intent) => intent.id)).toEqual([
        'docs.navigate',
        'docs.search',
        'docs.openProof',
        'docs.copyLink',
      ]);

      expect(dogfoodDocsSurfaceBlock.render({
        config: {
          docsTree: ['Guides', 'Blocks'],
          selectedRoute: 'blocks',
          selectedHeadingId: 'blocks',
          searchState: { query: 'block', hitCount: 3 },
          proofArtifacts: [{ id: 'blocks.gif', label: 'blocks.gif', available: true }],
        },
        mode: 'pipe',
      }).output).toBe('route\theading\tsearch-hit-count\tproofs\nblocks\tblocks\t3\tblocks.gif');
    });

  it('publishes DOGFOOD settings as a frame-owned block surface', () => {
      expect(settingsMenuBlockRegistryEntry.block).toBe(settingsMenuBlock);
      expect(settingsMenuBlockRegistryEntry.role).toBe('settings');
      expect(defaultDogfoodBlockRegistry.forSurface('frame.settings')).toBe(settingsMenuBlockRegistryEntry);
      expect(settingsMenuBlock.data?.names()).toEqual(['sections', 'selection']);
      expect(settingsMenuBlock.commands?.map((intent) => intent.id)).toEqual([
        'settings.activateRow',
        'settings.setLocale',
        'settings.setShellTheme',
      ]);

      expect(settingsMenuBlock.render({
        config: {
          sectionCount: 3,
          activeSettingLabel: 'Locale',
        },
        mode: 'pipe',
      }).output).toBe('Settings sections: 3; active: Locale');
    });

  it('publishes the DOGFOOD Blocks preview as a block-authored surface', () => {
      expect(blockPreviewBlockRegistryEntry.block).toBe(blockPreviewBlock);
      expect(blockPreviewBlockRegistryEntry.role).toBe('preview');
      expect(defaultDogfoodBlockRegistry.forSurface('blocks.preview')).toBe(blockPreviewBlockRegistryEntry);
      expect(blockPreviewBlock.data?.names()).toEqual(['definition', 'modes']);
      expect(blockPreviewBlock.commands?.map((intent) => intent.id)).toEqual([
        'blockPreview.selectBlock',
        'blockPreview.cycleMode',
      ]);

      expect(blockPreviewBlock.render({
        config: {
          blockName: 'ReaderSurface',
          modeCount: 4,
        },
        mode: 'pipe',
      }).output).toBe('Block preview: ReaderSurface; modes: 4');
    });
});
