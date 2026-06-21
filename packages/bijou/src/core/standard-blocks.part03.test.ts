import {
  bindSchemaBlockInput,
  describe,
  expect,
  inspectorPanelSchemaBlock,
  isSchemaBoundBlockDefinition,
  it,
  readerSurfaceSchemaBlock,
} from './standard-blocks.test-support.js';

describe('first-party standard block definitions', () => {
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
});

describe('first-party standard block definitions', () => {
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
});
