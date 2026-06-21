import { describe, expect, it } from 'vitest';
import { defaultDogfoodBlockRegistry, dogfoodBlockCoverageReport, footerHintBlock, footerHintBlockRegistryEntry, guideInspectorBlock, guideInspectorBlockRegistryEntry } from '../../../examples/docs/dogfood-blocks.js';

describe('DF-069 DOGFOOD block registry primitives', () => {
  it('publishes the DOGFOOD guide inspector as a block-authored surface', () => {
      expect(guideInspectorBlockRegistryEntry.block).toBe(guideInspectorBlock);
      expect(guideInspectorBlockRegistryEntry.role).toBe('inspector');
      expect(defaultDogfoodBlockRegistry.forSurface('guide.inspector')).toBe(
        guideInspectorBlockRegistryEntry,
      );
      expect(guideInspectorBlock.data?.names()).toEqual(['selection', 'facts']);
      expect(guideInspectorBlock.commands?.map((intent) => intent.id)).toEqual([
        'guideInspector.openSource',
        'guideInspector.focusSection',
      ]);

      expect(guideInspectorBlock.render({
        config: {
          selectionLabel: 'Block Preview',
          factCount: 6,
        },
        mode: 'accessible',
      }).output).toBe('Guide inspector: Block Preview; facts: 6');
    });

  it('publishes DOGFOOD footer hints as shell chrome owned by a block', () => {
      expect(footerHintBlockRegistryEntry.block).toBe(footerHintBlock);
      expect(footerHintBlockRegistryEntry.role).toBe('footer');
      expect(defaultDogfoodBlockRegistry.forSurface('frame.footer')).toBe(footerHintBlockRegistryEntry);
      expect(footerHintBlock.data?.names()).toEqual(['controls', 'status']);

      expect(footerHintBlock.render({
        config: {
          controls: '? Help • q Quit',
          activeHint: 'Tab next pane',
          status: 'page:blocks',
        },
        mode: 'pipe',
      }).output).toBe('? Help • q Quit • Tab next pane • page:blocks');
    });

  it('covers the intended semantic DOGFOOD surfaces without discovery-time rendering', () => {
      const report = dogfoodBlockCoverageReport();

      expect(report.missingSurfaceIds).toEqual([]);
      expect(report.registeredSurfaceIds).toEqual([
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
      expect(defaultDogfoodBlockRegistry.blockNames()).toEqual([
        'TitleScreenBlock',
        'NavigationListBlock',
        'DocumentationArticleBlock',
        'DogfoodDocsSurfaceBlock',
        'BlockPreviewBlock',
        'GuideInspectorBlock',
        'SettingsMenuBlock',
        'SearchPanelBlock',
        'NotificationCenterBlock',
        'PerfHudBlock',
        'HelpOverlayBlock',
        'CommandPaletteBlock',
        'FooterHintBlock',
        'BlockLabWorkbenchBlock',
      ]);
    });
});
