import { describe, expect, it } from 'vitest';
import {
  blockLabWorkbenchBlock,
  blockPreviewBlock,
  defaultDogfoodBlockRegistry,
  DOGFOOD_BLOCK_PACKAGE,
  DogfoodBlockRegistry,
  dogfoodBlockRegistryEntry,
  dogfoodDocsSurfaceBlock,
  navigationListBlock,
  requiredDogfoodBlockSurfaceIds,
  settingsMenuBlock,
} from '../../../examples/docs/dogfood-blocks.js';

describe('BE-001 DOGFOOD blocks facade', () => {
  it('keeps the public facade wired to every required DOGFOOD surface', () => {
    expect(defaultDogfoodBlockRegistry).toBeInstanceOf(DogfoodBlockRegistry);
    expect(requiredDogfoodBlockSurfaceIds).toEqual([
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

    for (const surfaceId of requiredDogfoodBlockSurfaceIds) {
      expect(defaultDogfoodBlockRegistry.forSurface(surfaceId)?.surfaceId).toBe(surfaceId);
    }

    expect(defaultDogfoodBlockRegistry.blockNames()).toContain('DogfoodDocsSurfaceBlock');
    expect(defaultDogfoodBlockRegistry.blockNames()).toContain('BlockLabWorkbenchBlock');
  });

  it('keeps representative block and helper exports available from dogfood-blocks.js', () => {
    expect(DOGFOOD_BLOCK_PACKAGE).toBe('@flyingrobots/bijou-dogfood');
    expect(dogfoodDocsSurfaceBlock.metadata.blockName).toBe('DogfoodDocsSurfaceBlock');
    expect(blockPreviewBlock.metadata.blockName).toBe('BlockPreviewBlock');
    expect(settingsMenuBlock.metadata.blockName).toBe('SettingsMenuBlock');
    expect(navigationListBlock.metadata.blockName).toBe('NavigationListBlock');
    expect(blockLabWorkbenchBlock.metadata.blockName).toBe('BlockLabWorkbenchBlock');

    const entry = dogfoodBlockRegistryEntry({
      block: blockPreviewBlock,
      role: 'preview',
      surfaceId: 'blocks.preview.facade-proof',
    });

    expect(entry.blockName).toBe('BlockPreviewBlock');
    expect(entry.packageName).toBe(DOGFOOD_BLOCK_PACKAGE);
  });
});
