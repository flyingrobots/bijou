import {
  _resetDefaultContextForTesting,
  afterEach,
  createFrameKeyMap,
  createSurface,
  createTestContext,
  describe,
  expect,
  frameModel,
  frameOptions,
  it,
  panePage,
  renderHelpLine,
  renderTransition,
  resolveHeaderLine,
  setDefaultContext,
} from './app-frame-render.test-support.js';

import type { EmptyModel } from './app-frame-render.test-support.js';

afterEach(() => { _resetDefaultContextForTesting(); });

describe('renderTransition', () => {
  const ctx = createTestContext({ mode: 'interactive' });

  it('applies surface-native cell overrides directly', () => {
    const prev = createSurface(2, 1, { char: '.', fg: '#111111', bg: '#222222', modifiers: ['dim'], empty: false });
    const next = createSurface(2, 1, { char: 'n', fg: '#aaaaaa', bg: '#bbbbbb', empty: false });

    const result = renderTransition(
      prev,
      next,
      ({ x }) => (x === 0
        ? {
          showNext: false,
          overrideChar: 'X',
          overrideCell: { char: 'X', fg: '#ff0000', bg: '#000000', modifiers: ['bold'], empty: false },
        }
        : { showNext: true }),
      0.5,
      2,
      1,
      ctx,
      0,
    );

    expect(result.get(0, 0)).toMatchObject({
      char: 'X',
      fg: '#ff0000',
      bg: '#000000',
      modifiers: ['bold'],
      empty: false,
    });
    expect(result.get(1, 0)).toMatchObject({
      char: 'n',
      fg: '#aaaaaa',
      bg: '#bbbbbb',
      empty: false,
    });
  });

  it('keeps the selected base cell styling for plain character overrides', () => {
    const prev = createSurface(1, 1, { char: 'p', fg: '#123456', bg: '#654321', modifiers: ['underline'], empty: false });
    const next = createSurface(1, 1, { char: 'n', fg: '#abcdef', bg: '#fedcba', empty: false });

    const result = renderTransition(
      prev,
      next,
      () => ({ showNext: false, overrideChar: '░' }),
      0.5,
      1,
      1,
      ctx,
      0,
    );

    expect(result.get(0, 0)).toMatchObject({
      char: '░',
      fg: '#123456',
      bg: '#654321',
      modifiers: ['underline'],
      empty: false,
    });
  });
});

describe('frame shell chrome surfaces', () => {
it('fills the full header and help lines with BCSS background styles', () => {
    const ctx = {
      ...createTestContext({ mode: 'interactive' }),
      resolveBCSS(identity: { type: string; id?: string; classes?: string[] }): Record<string, string> {
        if (identity.id === 'frame-header') return { color: '#ffffff', background: '#112233' };
        if (identity.id === 'frame-help') return { color: '#eeeeee', background: '#223344' };
        return {};
      },
    };
    setDefaultContext(ctx);

    const activePage = panePage<EmptyModel>('home', 'Home', {});
    const pagesById = new Map([['home', activePage]]);
    const model = frameModel<EmptyModel>({
      activePageId: 'home',
      pageOrder: ['home'],
      pageModels: { home: {} },
      focusedPaneByPage: { home: 'main' },
      scrollByPage: {},
      columns: 12,
      rows: 5,
    });
    const options = frameOptions([activePage], { title: 'Test' });

    const header = resolveHeaderLine(model, options, pagesById).surface;
    const help = renderHelpLine(model, {
      id: 'workspace',
      kind: 'workspace',
      owner: 'frame',
      inputMapId: 'frame-workspace',
      dismissible: false,
      blocksUnderlyingInput: false,
      hintSource: createFrameKeyMap(),
    }, undefined);

    for (let x = 0; x < 12; x++) {
      expect(header.get(x, 0).bg).toBe('#112233');
      expect(help.get(x, 0).bg).toBe('#223344');
      expect(header.get(x, 0).empty).toBe(false);
      expect(help.get(x, 0).empty).toBe(false);
    }
  });
});
