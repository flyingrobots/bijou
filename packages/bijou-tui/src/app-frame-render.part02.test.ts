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
  renderPageContentInto,
  resolveHeaderLine,
  setDefaultContext,
} from './app-frame-render.test-support.js';

import type { EmptyModel } from './app-frame-render.test-support.js';

afterEach(() => { _resetDefaultContextForTesting(); });

describe('frame shell chrome surfaces', () => {
it('paints unstyled pane text with the frame surface foreground', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    setDefaultContext(ctx);
    const expectedSurface = ctx.surface('primary');
    const expectedFg = expectedSurface.hex;
    const expectedBg = expectedSurface.bg;
    expect(expectedBg).toBeDefined();

    const page = panePage<EmptyModel>('home', 'Home', {}, (width, height) => {
      const surface = createSurface(width, height);
      surface.set(0, 0, { char: 'A', empty: false });
      return surface;
    });
    const pagesById = new Map([['home', page]]);
    const model = frameModel<EmptyModel>({
      activePageId: 'home',
      pageOrder: ['home'],
      pageModels: { home: {} },
      focusedPaneByPage: { home: 'main' },
      scrollByPage: {},
      columns: 8,
      rows: 4,
    });
    const target = createSurface(8, 4);

    renderPageContentInto(
      'home',
      model,
      { row: 0, col: 0, width: 8, height: 4 },
      pagesById,
      target,
      0,
      0,
      undefined,
      ctx,
    );

    const textCell = target.get(1, 0);
    expect(textCell.char).toBe('A');
    expect(textCell.fg).toBe(expectedFg);
    expect(textCell.bg).toBe(expectedBg);
  });
});

describe('frame shell chrome surfaces', () => {
it('falls back to the frame background when chrome rows have no explicit BCSS background', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    setDefaultContext(ctx);
    const expectedBg = ctx.surface('primary').bg ?? ctx.surface('secondary').bg;
    expect(expectedBg).toBeDefined();

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
      expect(header.get(x, 0).bg).toBe(expectedBg);
      expect(help.get(x, 0).bg).toBe(expectedBg);
      expect(header.get(x, 0).empty).toBe(false);
      expect(help.get(x, 0).empty).toBe(false);
    }
  });
});
