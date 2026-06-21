import {
  describe,
  expect,
  inspectorPanelBlock,
  it,
  lintModeLowering,
  readerSurfaceBlock,
} from './standard-blocks.test-support.js';

describe('first-party standard block definitions', () => {
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
});

describe('first-party standard block definitions', () => {
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
