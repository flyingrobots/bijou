import { describe, expect, it } from 'vitest';
import {
  defineAppShellComposition,
} from './app-shell-composition.js';
import {
  defineBlock,
  validateBlockMetadata,
  validateBlockPackageManifest,
  type BlockMetadata,
} from './block-metadata.js';
import {
  bindSchemaBlockInput,
  isSchemaBoundBlockDefinition,
} from './schema-block.js';
import { lintModeLowering } from './mode-lowering.js';
import {
  appShellBlock,
  inspectorPanelBlock,
  inspectorPanelSchemaBlock,
  readerSurfaceBlock,
  readerSurfaceSchemaBlock,
  standardBlockPackageManifest,
  standardBlocks,
  standardBlockStories,
} from './standard-blocks.js';

describe('first-party standard block definitions', () => {
  it('exports valid AppShell, ReaderSurface, and InspectorPanel block definitions', () => {
    expect(standardBlocks).toEqual([
      appShellBlock,
      readerSurfaceBlock,
      inspectorPanelBlock,
    ]);
    expect(Object.isFrozen(standardBlocks)).toBe(true);

    for (const block of standardBlocks) {
      expect(validateBlockMetadata(block.metadata)).toMatchObject({ passed: true });
      expect(Object.isFrozen(block)).toBe(true);
    }

    expect(validateBlockPackageManifest(standardBlockPackageManifest)).toMatchObject({
      passed: true,
    });
    expect(standardBlockPackageManifest.blocks).toEqual([
      'AppShell',
      'ReaderSurface',
      'InspectorPanel',
    ]);
  });

  it('keeps AppShell slots semantic and content-first', () => {
    const slotIds = appShellBlock.metadata.slots.map((slot) => slot.id);

    expect(slotIds).toEqual([
      'navigation',
      'content',
      'inspector',
      'status',
      'overlays',
    ]);
    expect(appShellBlock.metadata.slots.filter((slot) => slot.required !== false).map((slot) => slot.id)).toEqual([
      'content',
    ]);
    expect(slotIds).not.toContain('left');
    expect(slotIds).not.toContain('right');
    expect(slotIds).not.toContain('center');
    expect(slotIds).not.toContain('bottom');
  });

  it('declares data contracts and command intents for reader and inspector blocks', () => {
    expect(readerSurfaceBlock.data?.names()).toEqual(['article', 'outline']);
    expect(readerSurfaceBlock.data?.requirementIds()).toEqual([
      'reader.article',
      'reader.outline',
    ]);
    expect(readerSurfaceBlock.commands?.map((command) => command.id)).toEqual([
      'reader.selectHeading',
      'reader.openReference',
    ]);

    expect(inspectorPanelBlock.data?.names()).toEqual(['selection', 'details']);
    expect(inspectorPanelBlock.data?.requirementIds()).toEqual([
      'inspector.selection',
      'inspector.details',
    ]);
    expect(inspectorPanelBlock.commands?.map((command) => command.id)).toEqual([
      'inspector.revealSelection',
      'inspector.focusSource',
    ]);

    expect(appShellBlock.commands?.map((command) => command.id)).toEqual([
      'shell.focusRegion',
      'shell.toggleInspector',
      'shell.openOverlay',
    ]);
  });

  it('publishes deterministic stories and metadata story ids without rendering', () => {
    const storiesByBlock = new Map<string, readonly string[]>(
      ['AppShell', 'ReaderSurface', 'InspectorPanel'].map((blockName) => [
        blockName,
        standardBlockStories
          .filter((story) => story.blockName === blockName)
          .map((story) => story.state),
      ]),
    );

    expect(storiesByBlock.get('AppShell')).toEqual([
      'ready',
      'narrow',
      'overlay',
    ]);
    expect(storiesByBlock.get('ReaderSurface')).toEqual([
      'ready',
      'loading',
      'stale',
      'empty',
      'error',
    ]);
    expect(storiesByBlock.get('InspectorPanel')).toEqual([
      'ready',
      'empty',
      'loading',
      'stale',
      'error',
    ]);

    for (const block of standardBlocks) {
      const storyIds = standardBlockStories
        .filter((story) => story.blockName === block.metadata.blockName)
        .map((story) => story.id);
      expect(block.metadata.storyIds).toEqual(storyIds);
    }
  });

  it('binds reader and inspector schema data without owning rendering or provider lifecycle', () => {
    expect(isSchemaBoundBlockDefinition(readerSurfaceSchemaBlock)).toBe(true);
    expect(isSchemaBoundBlockDefinition(inspectorPanelSchemaBlock)).toBe(true);

    const readerBound = bindSchemaBlockInput(readerSurfaceSchemaBlock, {
      id: 'dx-031',
      title: 'DX-031',
      body: 'First-party block definitions.',
      outline: [{ id: 'intro', label: 'Intro' }],
    });
    expect(readerBound).toMatchObject({
      ok: true,
      input: {
        slots: {
          content: 'First-party block definitions.',
          outline: ['Intro'],
        },
      },
    });

    const inspectorBound = bindSchemaBlockInput(inspectorPanelSchemaBlock, {
      selectionId: 'heading:intro',
      label: 'Intro',
      details: ['Selected heading'],
    });
    expect(inspectorBound).toMatchObject({
      ok: true,
      input: {
        slots: {
          selection: 'Intro',
          details: ['Selected heading'],
        },
      },
    });

    expect('provider' in readerSurfaceSchemaBlock).toBe(false);
    expect('subscribe' in readerSurfaceSchemaBlock).toBe(false);
    expect('dispatch' in inspectorPanelSchemaBlock).toBe(false);
  });

  it('rejects schema boundary accessors without invoking them', () => {
    let getterCalls = 0;
    const accessorArticle = Object.defineProperties({}, {
      id: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'dx-031';
        },
      },
      title: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'DX-031';
        },
      },
      body: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'Hidden accessor body';
        },
      },
    });
    const accessorSelection = Object.defineProperties({}, {
      selectionId: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'heading:intro';
        },
      },
      label: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'Intro';
        },
      },
    });

    expect(bindSchemaBlockInput(readerSurfaceSchemaBlock, accessorArticle)).toMatchObject({
      ok: false,
    });
    expect(bindSchemaBlockInput(inspectorPanelSchemaBlock, accessorSelection)).toMatchObject({
      ok: false,
    });
    expect(getterCalls).toBe(0);
  });

  it('lets AppShell composition inspect declarations without executing render', () => {
    let renderCalls = 0;
    const spyBlock = defineBlock({
      metadata: spyMetadata,
      data: readerSurfaceBlock.data,
      commands: readerSurfaceBlock.commands,
      render: () => {
        renderCalls += 1;
        return { output: 'should not render during introspection' };
      },
    });

    const composition = defineAppShellComposition({
      slots: {
        navigation: spyBlock,
        content: readerSurfaceBlock,
        inspector: inspectorPanelBlock,
        status: appShellBlock,
      },
    });

    expect(composition.blocks()).toEqual([
      spyBlock,
      readerSurfaceBlock,
      inspectorPanelBlock,
      appShellBlock,
    ]);
    expect(composition.dataContracts()).toContain(readerSurfaceBlock.data);
    expect(composition.dataContracts()).toContain(inspectorPanelBlock.data);
    expect(composition.commandIntents().map((intent) => intent.id)).toContain('reader.selectHeading');
    expect(composition.commandIntents().map((intent) => intent.id)).toContain('inspector.revealSelection');
    expect(renderCalls).toBe(0);
  });

  it('renders AppShell semantic regions without placeholder output', () => {
    const rendered = appShellBlock.render({
      mode: 'pipe',
      slots: {
        navigation: 'Docs nav',
        content: 'Blocks guide',
        inspector: 'Current block: ReaderSurface',
        status: 'Ready',
        overlays: ['Command palette', 'Help drawer'],
      },
    });

    expect(rendered.output).toContain('AppShell');
    expect(rendered.output).toContain('navigation: Docs nav');
    expect(rendered.output).toContain('content: Blocks guide');
    expect(rendered.output).toContain('inspector: Current block: ReaderSurface');
    expect(rendered.output).toContain('status: Ready');
    expect(rendered.output).toContain('overlays: Command palette; Help drawer');
    expect(rendered.output).not.toContain('definition placeholder');
    expect(rendered.facts).toEqual(expect.arrayContaining([
      { kind: 'entity', key: 'block', value: 'AppShell' },
      { kind: 'state', key: 'block.rendered', value: true },
      { kind: 'entity', key: 'region.content', value: 'present' },
    ]));
  });

  it('renders ReaderSurface content, navigation, and outline deterministically', () => {
    const outline = Object.freeze(['Why Blocks', 'Lowering']);
    const rendered = readerSurfaceBlock.render({
      mode: 'accessible',
      slots: {
        content: '# Blocks\nBlocks are reusable Bijou view contracts.',
        navigation: 'Components > Blocks',
        outline,
      },
    });

    expect(rendered.output).toContain('ReaderSurface');
    expect(rendered.output).toContain('Navigation: Components > Blocks');
    expect(rendered.output).toContain('Content:');
    expect(rendered.output).toContain('# Blocks');
    expect(rendered.output).toContain('Outline: Why Blocks; Lowering');
    expect(rendered.output).not.toContain('definition placeholder');
    expect(outline).toEqual(['Why Blocks', 'Lowering']);
    expect(rendered.facts).toEqual(expect.arrayContaining([
      { kind: 'entity', key: 'block', value: 'ReaderSurface' },
      { kind: 'state', key: 'block.rendered', value: true },
      { kind: 'entity', key: 'slot.content', value: 'present' },
      { kind: 'entity', key: 'slot.outline', value: 'present' },
    ]));
  });

  it('renders InspectorPanel selection and details deterministically', () => {
    const details = Object.freeze(['type: block', 'state: ready']);
    const rendered = inspectorPanelBlock.render({
      mode: 'pipe',
      slots: {
        selection: 'ReaderSurface',
        details,
        actions: ['reveal source', 'focus docs'],
      },
    });

    expect(rendered.output).toContain('InspectorPanel');
    expect(rendered.output).toContain('selection: ReaderSurface');
    expect(rendered.output).toContain('details: type: block; state: ready');
    expect(rendered.output).toContain('actions: reveal source; focus docs');
    expect(rendered.output).not.toContain('definition placeholder');
    expect(details).toEqual(['type: block', 'state: ready']);
    expect(rendered.facts).toEqual(expect.arrayContaining([
      { kind: 'entity', key: 'block', value: 'InspectorPanel' },
      { kind: 'state', key: 'block.rendered', value: true },
      { kind: 'entity', key: 'slot.selection', value: 'present' },
      { kind: 'entity', key: 'slot.details', value: 'present' },
    ]));
  });

  it('preserves rendered block facts across output modes', () => {
    const modes = ['interactive', 'static', 'pipe', 'accessible'] as const;
    const report = lintModeLowering({
      modes: modes.map((mode) => ({
        mode,
        facts: readerSurfaceBlock.render({
          mode,
          slots: {
            content: 'Rendered body',
            outline: ['Intro'],
          },
        }).facts ?? [],
      })),
    });

    expect(report).toMatchObject({ passed: true });
  });
});

const spyMetadata: BlockMetadata = {
  packageName: '@flyingrobots/bijou',
  blockName: 'SpyNavigation',
  family: 'app-structure',
  scale: 'panel',
  modes: ['interactive', 'static', 'pipe', 'accessible'],
  docs: {
    summary: 'Test-only navigation block for introspection proof.',
  },
  slots: [{ id: 'content', required: true }],
};
