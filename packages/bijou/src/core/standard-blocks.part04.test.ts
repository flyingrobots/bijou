import {
  appShellBlock,
  defineAppShellComposition,
  defineBlock,
  describe,
  expect,
  inspectorPanelBlock,
  isSurfaceOutput,
  it,
  readerSurfaceBlock,
  spyMetadata,
  surfaceText,
} from './standard-blocks.test-support.js';

describe('first-party standard block definitions', () => {
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
});

describe('first-party standard block definitions', () => {
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
});

describe('first-party standard block definitions', () => {
it('renders interactive and static standard blocks as surfaces while preserving text lowering modes', () => {
    const slots = {
      navigation: 'Docs nav',
      content: 'Blocks guide',
      inspector: 'Current block: ReaderSurface',
      status: 'Ready',
    };
    const interactive = appShellBlock.render({ mode: 'interactive', slots, config: { width: 64 } });
    const staticOutput = appShellBlock.render({ mode: 'static', slots, config: { width: 64 } });
    const pipe = appShellBlock.render({ mode: 'pipe', slots });
    const accessible = appShellBlock.render({ mode: 'accessible', slots });

    if (!isSurfaceOutput(interactive) || !isSurfaceOutput(staticOutput)) {
      throw new Error('interactive and static AppShell output should be surfaces');
    }
    expect(typeof pipe.output).toBe('string');
    expect(typeof accessible.output).toBe('string');
    expect(surfaceText(interactive.output)).toContain('AppShell');
    expect(surfaceText(interactive.output)).toContain('Navigation');
    expect(surfaceText(interactive.output)).toContain('Docs nav');
    expect(pipe.output).toContain('navigation: Docs nav');
    expect(accessible.output).toContain('Navigation: Docs nav');
  });
});
