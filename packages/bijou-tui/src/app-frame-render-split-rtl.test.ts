import type { BijouContext, InlineDirection, Surface } from '@flyingrobots/bijou';
import {
  _resetDefaultContextForTesting,
  afterEach,
  createPanelDockState,
  createPanelVisibilityState,
  createTestContext,
  describe,
  expect,
  frameModel,
  it,
  parseAnsiToSurface,
  renderFrameNode,
  setDefaultContext,
} from './app-frame-render.test-support.js';
import type { EmptyModel, FrameLayoutNode } from './app-frame-render.test-support.js';
import type { LayoutRect } from './layout-rect.js';

afterEach(() => { _resetDefaultContextForTesting(); });

const W = 21;
const H = 9;
const pane = (paneId: string, label = paneId): FrameLayoutNode => ({
  kind: 'pane', paneId, render: (width, height) => parseAnsiToSurface(label, width, height),
});
const row = (splitId: string, a: FrameLayoutNode, b: FrameLayoutNode, ratio = 0.5, dividerChar?: string): FrameLayoutNode => ({
  kind: 'split', splitId, state: { ratio, focused: 'a' }, paneA: a, paneB: b, ...(dividerChar ? { dividerChar } : {}),
});
// A horizontal split inside a vertical split inside a horizontal split.
const NESTED: FrameLayoutNode = row('outer', {
  kind: 'split', splitId: 'mid', direction: 'column', state: { ratio: 0.5, focused: 'a' },
  paneA: row('inner', pane('a1'), pane('a2'), 0.4), paneB: pane('m2'),
}, pane('o2'), 0.6);

function render(node: FrameLayoutNode, direction: InlineDirection | undefined, ctx: BijouContext) {
  setDefaultContext(ctx);
  return renderFrameNode(node, { row: 0, col: 0, width: W, height: H }, {
    model: frameModel<EmptyModel>({ activePageId: 'p', pageOrder: ['p'], pageModels: { p: {} } }),
    pageId: 'p', focusedPaneId: undefined, scrollByPane: {}, visibility: createPanelVisibilityState(),
    dockState: createPanelDockState(), frameBackgroundToken: undefined, ctx, direction,
  });
}
const cells = (surface: Surface, rect: LayoutRect): string[] => {
  const out: string[] = [];
  for (let y = rect.row; y < rect.row + rect.height; y++) {
    for (let x = rect.col; x < rect.col + rect.width; x++) out.push(surface.get(x, y).char);
  }
  return out;
};
const mirrored = (rect: LayoutRect): LayoutRect => ({ ...rect, col: W - rect.col - rect.width });
const interactive = () => createTestContext({ mode: 'interactive' });

describe('frame split panes under rtl', () => {
  it('puts the start pane on the physical right with the same sizes and contents', () => {
    const node = row('s', pane('start', '漢字 é'), pane('end', 'ｶﾅ é'), 0.3);
    const ltr = render(node, 'ltr', interactive());
    const rtl = render(node, 'rtl', interactive());
    const start = ltr.paneRects.get('start');
    const end = ltr.paneRects.get('end');
    expect(start).toEqual({ row: 0, col: 0, width: 6, height: H });
    expect(rtl.paneRects.get('start')).toEqual({ row: 0, col: 15, width: 6, height: H });
    expect(rtl.paneRects.get('end')).toEqual({ row: 0, col: 0, width: 14, height: H });
    for (const rect of [start, end]) {
      expect(rect).toBeDefined();
      if (rect == null) continue;
      expect(cells(rtl.surface, mirrored(rect))).toEqual(cells(ltr.surface, rect));
    }
    expect(rtl.surface.get(14, 0).char).toBe('│');
    expect(ltr.surface.get(6, 0).char).toBe('│');
  });

  it('mirrors horizontal splits at every depth and never the vertical split', () => {
    const ltr = render(NESTED, 'ltr', interactive());
    const rtl = render(NESTED, 'rtl', interactive());
    for (const id of ['a1', 'a2', 'm2', 'o2']) {
      const rect = ltr.paneRects.get(id);
      expect(rect).toBeDefined();
      if (rect != null) expect(rtl.paneRects.get(id)).toEqual(mirrored(rect));
    }
    // The vertical split keeps a1/a2 above m2 in both directions.
    expect(rtl.paneRects.get('a1')?.row).toBe(0);
    expect(rtl.paneRects.get('m2')?.row).toBeGreaterThan(0);
    expect(rtl.paneRects.get('a1')?.col).toBeGreaterThan(rtl.paneRects.get('a2')?.col ?? 99);
    expect(rtl.paneRects.get('o2')?.col).toBe(0);
  });

  it('keeps pane order logical (start to end) in both directions', () => {
    expect(render(NESTED, 'ltr', interactive()).paneOrder).toEqual(['a1', 'a2', 'm2', 'o2']);
    expect(render(NESTED, 'rtl', interactive()).paneOrder).toEqual(['a1', 'a2', 'm2', 'o2']);
  });

  it('mirrors in static mode and keeps logical placement in pipe and accessible modes', () => {
    const ltr = render(NESTED, 'ltr', interactive()).paneRects;
    expect(render(NESTED, 'rtl', createTestContext({ mode: 'static' })).paneRects.get('o2')?.col).toBe(0);
    for (const mode of ['pipe', 'accessible'] as const) {
      expect(render(NESTED, 'rtl', createTestContext({ mode })).paneRects).toEqual(ltr);
    }
  });

  it('reads ctx.direction when the frame gives none, and an explicit ltr wins over an rtl context', () => {
    const ltr = render(NESTED, undefined, interactive()).paneRects;
    const fromCtx = render(NESTED, undefined, createTestContext({ mode: 'interactive', direction: 'rtl' }));
    expect(fromCtx.paneRects.get('o2')?.col).toBe(0);
    const explicit = render(NESTED, 'ltr', createTestContext({ mode: 'interactive', direction: 'rtl' }));
    expect(explicit.paneRects).toEqual(ltr);
  });

  it('draws the divider glyph unchanged: box-drawing and ASCII dividers are symmetric', () => {
    const ascii = render(row('s', pane('a'), pane('b'), 0.5, '|'), 'rtl', interactive());
    const rect = ascii.paneRects.get('b');
    expect(rect?.col).toBe(0);
    expect(ascii.surface.get(rect?.width ?? 0, 0).char).toBe('|');
    const box = render(row('s', pane('a'), pane('b')), 'rtl', interactive());
    expect(box.surface.get(box.paneRects.get('b')?.width ?? 0, 0).char).toBe('│');
  });
});
