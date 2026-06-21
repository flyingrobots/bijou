import { describe, expect, it } from 'vitest';
import { defaultDogfoodBlockRegistry, navigationListBlock, navigationListBlockRegistryEntry, notificationCenterBlock, notificationCenterBlockRegistryEntry, perfHudBlock, perfHudBlockRegistryEntry, searchPanelBlock, searchPanelBlockRegistryEntry, blockLabWorkbenchBlock, blockLabWorkbenchBlockRegistryEntry, titleScreenBlock, titleScreenBlockRegistryEntry } from '../../../examples/docs/dogfood-blocks.js';

describe('DF-069 DOGFOOD block registry primitives', () => {
  it('publishes BlockLab as an inspectable DOGFOOD workbench block', () => {
      expect(blockLabWorkbenchBlockRegistryEntry.block).toBe(blockLabWorkbenchBlock);
      expect(blockLabWorkbenchBlockRegistryEntry.role).toBe('workbench');
      expect(defaultDogfoodBlockRegistry.forSurface('blocklab.workbench')).toBe(
        blockLabWorkbenchBlockRegistryEntry,
      );
      expect(defaultDogfoodBlockRegistry.blockNames()).toContain('BlockLabWorkbenchBlock');
      expect(blockLabWorkbenchBlock.data?.names()).toEqual(['stories', 'selection']);
      expect(blockLabWorkbenchBlock.commands?.map((intent) => intent.id)).toEqual([
        'blocklab.selectStory',
        'blocklab.cycleVariant',
        'blocklab.setProfile',
      ]);

      const output = blockLabWorkbenchBlock.render({
        config: {
          storyCount: 12,
          selectedStoryLabel: 'Button / Primary',
          profileLabel: 'desktop',
        },
        mode: 'pipe',
      }).output;

      expect(output).toBe(
        'BlockLabWorkbench stories: 12; selected: Button / Primary; profile: desktop',
      );
    });

  it('publishes the DOGFOOD title screen as an app-level block', () => {
      expect(titleScreenBlockRegistryEntry.block).toBe(titleScreenBlock);
      expect(titleScreenBlockRegistryEntry.role).toBe('title');
      expect(defaultDogfoodBlockRegistry.forSurface('landing.title')).toBe(titleScreenBlockRegistryEntry);
      expect(titleScreenBlock.data?.names()).toEqual(['route']);
      expect(titleScreenBlock.commands?.map((intent) => intent.id)).toEqual([
        'title.openDocs',
        'title.openBlockLab',
        'title.openSettings',
      ]);

      expect(titleScreenBlock.render({
        config: {
          title: 'Bijou',
          subtitle: 'Terminal UI proof',
        },
        mode: 'accessible',
      }).output).toBe('Bijou: Terminal UI proof');
    });

  it('publishes DOGFOOD navigation as a selectable block surface', () => {
      expect(navigationListBlockRegistryEntry.block).toBe(navigationListBlock);
      expect(navigationListBlockRegistryEntry.role).toBe('navigation');
      expect(defaultDogfoodBlockRegistry.forSurface('docs.navigation')).toBe(
        navigationListBlockRegistryEntry,
      );
      expect(navigationListBlock.data?.names()).toEqual(['items', 'selection']);
      expect(navigationListBlock.commands?.map((intent) => intent.id)).toEqual([
        'navigation.selectItem',
        'navigation.expandGroup',
        'navigation.collapseGroup',
      ]);

      expect(navigationListBlock.render({
        config: {
          itemCount: 7,
          activeLabel: 'Blocks',
        },
        mode: 'pipe',
      }).output).toBe('Navigation items: 7; active: Blocks');
    });

  it('publishes DOGFOOD search as an inspectable command surface', () => {
      expect(searchPanelBlockRegistryEntry.block).toBe(searchPanelBlock);
      expect(searchPanelBlockRegistryEntry.role).toBe('search');
      expect(defaultDogfoodBlockRegistry.forSurface('frame.search')).toBe(searchPanelBlockRegistryEntry);
      expect(searchPanelBlock.data?.names()).toEqual(['query', 'items', 'selection']);
      expect(searchPanelBlock.commands?.map((intent) => intent.id)).toEqual([
        'search.submitQuery',
        'search.selectResult',
        'search.dismiss',
      ]);

      expect(searchPanelBlock.render({
        config: {
          query: 'block',
          resultCount: 3,
          activeResultLabel: 'Block Preview',
        },
        mode: 'pipe',
      }).output).toBe('Search query: block; results: 3; active: Block Preview');

      expect(searchPanelBlock.render({
        config: { title: 'Search blocks' },
        mode: 'accessible',
      }).output).toBe('Search blocks');
    });

  it('publishes DOGFOOD notifications as an inspectable frame surface', () => {
      expect(notificationCenterBlockRegistryEntry.block).toBe(notificationCenterBlock);
      expect(notificationCenterBlockRegistryEntry.role).toBe('notifications');
      expect(defaultDogfoodBlockRegistry.forSurface('frame.notifications')).toBe(
        notificationCenterBlockRegistryEntry,
      );
      expect(notificationCenterBlock.data?.names()).toEqual(['items', 'filter']);
      expect(notificationCenterBlock.commands?.map((intent) => intent.id)).toEqual([
        'notifications.dismiss',
        'notifications.setFilter',
      ]);

      expect(notificationCenterBlock.render({
        config: {
          notificationCount: 4,
          activeFilterLabel: 'Unread',
        },
        mode: 'pipe',
      }).output).toBe('Notification items: 4; filter: Unread');
    });

  it('publishes DOGFOOD performance HUD as an inspectable diagnostics surface', () => {
      expect(perfHudBlockRegistryEntry.block).toBe(perfHudBlock);
      expect(perfHudBlockRegistryEntry.role).toBe('diagnostics');
      expect(defaultDogfoodBlockRegistry.forSurface('frame.perfHud')).toBe(perfHudBlockRegistryEntry);
      expect(perfHudBlock.data?.names()).toEqual(['metrics', 'viewport']);
      expect(perfHudBlock.commands?.map((intent) => intent.id)).toEqual(['perfHud.toggle']);

      expect(perfHudBlock.render({
        config: {
          fps: 60,
          frameMs: 1.25,
          columns: 150,
          rows: 43,
        },
        mode: 'pipe',
      }).output).toBe('Perf HUD fps: 60; frame: 1.25 ms; size: 150x43');
    });
});
